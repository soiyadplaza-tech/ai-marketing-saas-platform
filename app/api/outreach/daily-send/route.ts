import { db } from "@/db";
import { leads, messages, opportunities, suppressions } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { ORG_ID, logActivity, recordJob, notify } from "@/lib/repo";
import { sendEmail, configuredProvider } from "@/lib/mailer";
import { generateOutreach } from "@/lib/outreach";
import type { DetectedOpportunity } from "@/lib/opportunities";
import { quotaStatus, EMAIL_DAILY_MIN_TARGET, EMAIL_DAILY_MAX_LIMIT } from "@/lib/email-limits";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Daily bulk send: sends personalized outreach to uncontacted leads (highest
// score first), enforcing the daily minimum target (400) and hard maximum (1500).
export async function POST(req: Request) {
  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const dailyLimit = Math.min(EMAIL_DAILY_MAX_LIMIT, Math.max(EMAIL_DAILY_MIN_TARGET, Number(body.dailyLimit) || EMAIL_DAILY_MIN_TARGET));
  const requested = Math.min(Number(body.limit) || dailyLimit, dailyLimit);

  if (configuredProvider() === "none") {
    return Response.json({ ok: false, error: "No email provider configured. Add RESEND_API_KEY or SMTP in Integrations." }, { status: 409 });
  }

  const quota = await quotaStatus(dailyLimit);
  const cap = Math.min(requested, quota.remainingToday);
  if (cap <= 0) {
    return Response.json({ ok: true, sent: 0, failed: 0, skipped: 0, reason: "daily_limit_reached", quota }, { status: 200 });
  }

  // Select leads with an email that haven't been contacted in the last 30 days.
  const conds = [
    eq(leads.orgId, ORG_ID),
    sql`${leads.email} IS NOT NULL`,
    sql`(${leads.lastContactedAt} IS NULL OR ${leads.lastContactedAt} < now() - interval '30 days')`,
  ];
  const targets = await db.select().from(leads).where(and(...conds)).orderBy(desc(leads.leadScore)).limit(cap);

  let sent = 0, failed = 0, skipped = 0;
  const errors: string[] = [];
  for (const lead of targets) {
    if (!lead.email) { skipped++; continue; }
    const suppressed = await db.select({ id: suppressions.id }).from(suppressions).where(and(eq(suppressions.orgId, ORG_ID), eq(suppressions.email, lead.email))).limit(1);
    if (suppressed.length) { skipped++; continue; }

    const ops = await db.select().from(opportunities).where(eq(opportunities.leadId, lead.id));
    const detected: DetectedOpportunity[] = ops.map((o) => ({
      problem: o.problem, evidence: o.evidence || "", severity: (o.severity as any) || "medium",
      businessImpact: o.businessImpact || "", recommendedService: o.recommendedService as any,
      recommendedAction: o.recommendedAction || "", confidence: o.confidence || 70,
    }));
    const out = generateOutreach({
      company: lead.company, contactName: lead.contactName, website: lead.website,
      industry: lead.industry, location: lead.location, websiteScore: lead.websiteScore, opportunities: detected,
    });
    const result = await sendEmail({ to: lead.email, subject: out.subject, text: out.email });
    if (result.ok) {
      await db.insert(messages).values({
        orgId: ORG_ID, leadId: lead.id, channel: "email", direction: "outbound",
        subject: out.subject, body: out.email, status: "sent", approved: true, aiGenerated: true, sentAt: new Date(),
      });
      await db.update(leads).set({ lastContactedAt: new Date(), stage: lead.stage === "new_lead" ? "contacted" : lead.stage, updatedAt: new Date() }).where(eq(leads.id, lead.id));
      sent++;
    } else {
      failed++;
      errors.push(`${lead.email}: ${result.error}`);
      if (failed >= 3) { errors.push("Stopped after 3 consecutive failures."); break; }
    }
  }

  await recordJob("email_send", `Daily send: ${sent} sent`, sent > 0 ? "completed" : "failed", Date.now() - started, null, { sent, failed, skipped });
  if (sent > 0) {
    await logActivity("outreach", `Daily send: ${sent} emails sent`, null, { sent });
    await notify("outreach_sent", "Daily send completed", `${sent} emails sent today`, null);
  }

  return Response.json({ ok: true, sent, failed, skipped, errors: errors.slice(0, 5), quota: await quotaStatus(dailyLimit) });
}
