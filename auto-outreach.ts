import { db } from "@/db";
import { leads, opportunities, messages, suppressions } from "@/db/schema";
import { and, eq, desc, isNull, sql } from "drizzle-orm";
import { ORG_ID, logActivity, recordJob, notify } from "@/lib/repo";
import { generateOutreach } from "@/lib/outreach";
import { auditAndScoreLead } from "@/lib/run-audit";
import { configuredProvider, sendEmail } from "@/lib/mailer";
import { quotaStatus } from "@/lib/email-limits";
import type { DetectedOpportunity } from "@/lib/opportunities";

// Audit a batch of fresh, unaudited leads that have a website, then re-score.
export async function auditFreshLeads(count: number): Promise<{ audited: number; failed: number }> {
  const targets = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, ORG_ID), isNull(leads.auditedAt), sql`${leads.website} IS NOT NULL`))
    .orderBy(desc(leads.leadScore))
    .limit(count);
  let audited = 0, failed = 0;
  for (const lead of targets) {
    try {
      const { ok } = await auditAndScoreLead(lead.id);
      ok ? audited++ : failed++;
    } catch {
      failed++;
    }
  }
  return { audited, failed };
}

export interface RunResult {
  generated: number;
  approved: number;
  sent: number;
  skipped: number;
  failed: number;
  provider: string;
  quota: { sentToday: number; remainingToday: number; dailyLimit: number };
  errors: string[];
}

// Generate personalized AI drafts for the top leads that have no message yet.
export async function ensureDrafts(count: number): Promise<number> {
  const existing = await db
    .select({ leadId: messages.leadId })
    .from(messages)
    .where(and(eq(messages.orgId, ORG_ID), eq(messages.channel, "email")));
  const hasMsg = new Set(existing.map((m) => m.leadId));

  const targets = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, ORG_ID), eq(leads.status, "new_lead")))
    .orderBy(desc(leads.leadScore))
    .limit(count * 2);

  const toGen = targets.filter((l) => l.email && !hasMsg.has(l.id)).slice(0, count);
  let created = 0;
  for (const lead of toGen) {
    const ops = await db.select().from(opportunities).where(eq(opportunities.leadId, lead.id));
    const detected: DetectedOpportunity[] = ops.map((o) => ({
      problem: o.problem,
      evidence: o.evidence || "",
      severity: (o.severity as DetectedOpportunity["severity"]) || "medium",
      businessImpact: o.businessImpact || "",
      recommendedService: o.recommendedService as DetectedOpportunity["recommendedService"],
      recommendedAction: o.recommendedAction || "",
      confidence: o.confidence || 70,
    }));
    const out = generateOutreach({
      company: lead.company,
      contactName: lead.contactName,
      website: lead.website,
      industry: lead.industry,
      location: lead.location,
      websiteScore: lead.websiteScore,
      opportunities: detected,
    });
    await db.insert(messages).values({
      orgId: ORG_ID,
      leadId: lead.id,
      channel: "email",
      direction: "outbound",
      subject: out.subject,
      body: out.email,
      status: "draft",
      aiGenerated: true,
      approved: false,
    });
    created++;
  }
  return created;
}

// Auto-approve a small batch of drafts (only when auto mode is explicitly enabled).
export async function autoApprove(count: number): Promise<number> {
  const drafts = await db
    .select()
    .from(messages)
    .where(and(eq(messages.orgId, ORG_ID), eq(messages.status, "draft"), eq(messages.channel, "email")))
    .orderBy(desc(messages.createdAt))
    .limit(count);
  for (const m of drafts) {
    await db.update(messages).set({ approved: true, status: "approved" }).where(eq(messages.id, m.id));
  }
  return drafts.length;
}

// Send approved emails through the real provider, respecting suppression + caps.
export async function sendApprovedBatch(limit: number): Promise<Omit<RunResult, "generated" | "approved">> {
  const provider = configuredProvider();
  const result: Omit<RunResult, "generated" | "approved"> = {
    sent: 0,
    skipped: 0,
    failed: 0,
    provider,
    quota: { sentToday: 0, remainingToday: 0, dailyLimit: 0 },
    errors: [],
  };
  if (provider === "none") {
    result.errors.push("No email provider configured.");
    return result;
  }

  const quota = await quotaStatus();
  result.quota = { sentToday: quota.sentToday, remainingToday: quota.remainingToday, dailyLimit: quota.dailyLimit };
  const allowed = Math.max(0, Math.min(limit, quota.remainingToday));
  if (allowed <= 0) {
    result.errors.push("Daily limit reached.");
    return result;
  }

  const candidates = await db
    .select()
    .from(messages)
    .where(and(eq(messages.orgId, ORG_ID), eq(messages.channel, "email"), eq(messages.status, "approved")))
    .orderBy(desc(messages.createdAt))
    .limit(allowed);

  for (const m of candidates) {
    if (!m.leadId) { result.skipped++; continue; }
    const [lead] = await db.select().from(leads).where(eq(leads.id, m.leadId)).limit(1);
    if (!lead?.email) { result.skipped++; continue; }
    const suppressed = await db
      .select({ id: suppressions.id })
      .from(suppressions)
      .where(and(eq(suppressions.orgId, ORG_ID), eq(suppressions.email, lead.email)))
      .limit(1);
    if (suppressed.length) { result.skipped++; continue; }

    const res = await sendEmail({ to: lead.email, subject: m.subject || "A message from FOYSAL IT", text: m.body });
    if (!res.ok) {
      result.failed++;
      result.errors.push(`${lead.email}: ${res.error}`);
      if (result.failed >= 3) break;
      continue;
    }
    await db.update(messages).set({ status: "sent", sentAt: new Date() }).where(eq(messages.id, m.id));
    await db
      .update(leads)
      .set({ lastContactedAt: new Date(), stage: lead.stage === "audited" ? "contacted" : lead.stage, updatedAt: new Date() })
      .where(eq(leads.id, lead.id));
    result.sent++;
  }
  return result;
}

// Full daily pipeline: ensure drafts → auto-approve → send, up to the target.
export async function runDailyPipeline(target: number, batch: number, auto = false): Promise<RunResult & { providerConfigured: boolean }> {
  const generated = await ensureDrafts(batch);
  const approved = await autoApprove(batch);
  const send = await sendApprovedBatch(batch);
  const quota = await quotaStatus(target);

  if (send.sent > 0) {
    await logActivity("outreach", `Daily ${auto ? "auto " : ""}run sent ${send.sent} email(s)`);
    await recordJob("email_auto", `Daily outreach run: ${send.sent} sent`, "completed", 0, null, { sent: send.sent, generated, approved });
    await notify("outreach_sent", `Daily outreach ${auto ? "auto " : ""}run`, `${send.sent} personalized email(s) sent via ${send.provider}.`);
  }
  if (send.failed > 0) await notify("automation_error", "Outreach run had failures", send.errors[0] || "Some emails failed to send.");

  return {
    generated,
    approved,
    sent: send.sent,
    skipped: send.skipped,
    failed: send.failed,
    provider: send.provider,
    providerConfigured: send.provider !== "none",
    errors: send.errors,
    quota: { sentToday: quota.sentToday, remainingToday: quota.remainingToday, dailyLimit: quota.dailyLimit },
  };
}

// Full autopilot: audit fresh leads → score → generate → auto-approve → send.
export async function runAutopilot(target: number, batch: number, auditBatch: number) {
  const { audited, failed: auditFailed } = await auditFreshLeads(auditBatch);
  const pipeline = await runDailyPipeline(target, batch, true);
  await recordJob("autopilot", `Autopilot: ${audited} audited, ${pipeline.sent} sent`, "completed", 0, null, {
    audited,
    auditFailed,
    sent: pipeline.sent,
    generated: pipeline.generated,
    approved: pipeline.approved,
  });
  return {
    ...pipeline,
    audited,
    auditFailed,
  };
}
