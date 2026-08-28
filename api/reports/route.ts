import { db } from "@/db";
import { leads, audits, auditFindings, opportunities, messages, activities, tasks } from "@/db/schema";
import { and, eq, desc, gte, sql, count } from "drizzle-orm";
import { ORG_ID, recordJob } from "@/lib/repo";
import { serviceName } from "@/lib/services";
import { serviceAuditMatrix } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

// GET /api/reports?type=audit_summary|lead_audit&leadId=..&type=weekly_notes|monthly_status
export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "audit_summary";
  const leadId = url.searchParams.get("leadId");
  const started = Date.now();

  let report;
  if (type === "lead_audit" && leadId) report = await leadAuditReport(parseInt(leadId));
  else if (type === "weekly_notes") report = await weeklyNotes();
  else if (type === "monthly_status") report = await monthlyStatus();
  else report = await auditSummary();

  await recordJob("report", `Report: ${type}`, "completed", Date.now() - started, leadId ? parseInt(leadId) : null);
  return Response.json({ type, generatedAt: new Date().toISOString(), report });
}

async function auditSummary() {
  const org = eq(audits.orgId, ORG_ID);
  const rows = await db
    .select()
    .from(audits)
    .where(and(org, eq(audits.status, "completed")))
    .orderBy(desc(audits.createdAt))
    .limit(200);

  const avg = (k: keyof (typeof rows)[number]) =>
    rows.length ? Math.round(rows.reduce((a, r) => a + (Number(r[k]) || 0), 0) / rows.length) : 0;

  const findingsAgg = await db
    .select({ title: auditFindings.title, severity: auditFindings.severity, c: count() })
    .from(auditFindings)
    .where(sql`${auditFindings.passed} = false`)
    .groupBy(auditFindings.title, auditFindings.severity)
    .orderBy(desc(count()))
    .limit(10);

  return {
    title: "Website Audit Summary Report",
    audited: rows.length,
    averages: {
      overall: avg("overallScore"),
      technical: avg("technicalScore"),
      onpage: avg("onpageScore"),
      performance: avg("performanceScore"),
      conversion: avg("conversionScore"),
      local: avg("localScore"),
      social: avg("socialScore"),
    },
    topIssues: findingsAgg.map((f) => ({ issue: f.title, severity: f.severity, count: Number(f.c) })),
    sites: rows.slice(0, 25).map((r) => ({ url: r.url, score: r.overallScore, date: r.createdAt })),
  };
}

async function leadAuditReport(leadId: number) {
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.orgId, ORG_ID)));
  if (!lead) return { title: "Lead not found" };
  const [audit] = await db.select().from(audits).where(eq(audits.leadId, leadId)).orderBy(desc(audits.createdAt)).limit(1);
  const findings = audit ? await db.select().from(auditFindings).where(eq(auditFindings.auditId, audit.id)) : [];
  const ops = await db.select().from(opportunities).where(eq(opportunities.leadId, leadId));

  return {
    title: `Professional Audit Report — ${lead.company}`,
    lead: {
      company: lead.company,
      contact: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      industry: lead.industry,
      location: lead.location,
      leadScore: lead.leadScore,
      category: lead.scoreCategory,
    },
    scores: audit
      ? {
          overall: audit.overallScore,
          technical: audit.technicalScore,
          onpage: audit.onpageScore,
          performance: audit.performanceScore,
          conversion: audit.conversionScore,
          local: audit.localScore,
          social: audit.socialScore,
        }
      : null,
    findings: findings.map((f) => ({ category: f.category, title: f.title, detail: f.detail, severity: f.severity, passed: f.passed })),
    opportunities: ops.map((o) => ({
      problem: o.problem,
      evidence: o.evidence,
      severity: o.severity,
      businessImpact: o.businessImpact,
      service: serviceName(o.recommendedService),
      action: o.recommendedAction,
      confidence: o.confidence,
    })),
    recommendedServices: (lead.recommendedServices || []).map((s) => serviceName(s)),
    serviceMatrix: audit?.data ? serviceAuditMatrix(audit.data as any) : null,
  };
}

async function weeklyNotes() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [newLeads] = await db.select({ c: count() }).from(leads).where(and(eq(leads.orgId, ORG_ID), gte(leads.createdAt, weekAgo)));
  const [audited] = await db.select({ c: count() }).from(audits).where(and(eq(audits.orgId, ORG_ID), gte(audits.createdAt, weekAgo)));
  const [msgs] = await db.select({ c: count() }).from(messages).where(and(eq(messages.orgId, ORG_ID), gte(messages.createdAt, weekAgo)));
  const [sent] = await db.select({ c: count() }).from(messages).where(and(eq(messages.orgId, ORG_ID), eq(messages.status, "sent"), gte(messages.sentAt, weekAgo)));
  const [openTasks] = await db.select({ c: count() }).from(tasks).where(and(eq(tasks.orgId, ORG_ID), eq(tasks.status, "open")));
  const recent = await db.select().from(activities).where(and(eq(activities.orgId, ORG_ID), gte(activities.createdAt, weekAgo))).orderBy(desc(activities.createdAt)).limit(20);
  const byCat = await db.select({ cat: leads.scoreCategory, c: count() }).from(leads).where(eq(leads.orgId, ORG_ID)).groupBy(leads.scoreCategory);

  return {
    title: "Weekly Team Performance — Meeting Notes",
    period: `${weekAgo.toLocaleDateString()} – ${new Date().toLocaleDateString()}`,
    metrics: {
      newLeads: Number(newLeads.c),
      sitesAudited: Number(audited.c),
      messagesCreated: Number(msgs.c),
      emailsSent: Number(sent.c),
      openTasks: Number(openTasks.c),
    },
    pipeline: Object.fromEntries(byCat.map((r) => [r.cat, Number(r.c)])),
    agenda: [
      "Review new priority leads and assign owners",
      "Audit backlog & failed audits to retry",
      "Approve pending outreach drafts",
      "Discuss overdue follow-ups",
      "Blockers & next-week targets",
    ],
    highlights: recent.map((a) => `${new Date(a.createdAt).toLocaleDateString()} — ${a.message}`),
  };
}

async function monthlyStatus() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [total] = await db.select({ c: count() }).from(leads).where(eq(leads.orgId, ORG_ID));
  const [newLeads] = await db.select({ c: count() }).from(leads).where(and(eq(leads.orgId, ORG_ID), gte(leads.createdAt, monthAgo)));
  const [audited] = await db.select({ c: count() }).from(audits).where(and(eq(audits.orgId, ORG_ID), gte(audits.createdAt, monthAgo)));
  const [won] = await db.select({ c: count(), v: sql<number>`coalesce(sum(${leads.dealValue}),0)` }).from(leads).where(and(eq(leads.orgId, ORG_ID), eq(leads.stage, "won")));
  const [ops] = await db.select({ c: count() }).from(opportunities).where(eq(opportunities.orgId, ORG_ID));

  return {
    title: "Monthly Lead & Audit Status Report",
    period: `${monthAgo.toLocaleDateString()} – ${new Date().toLocaleDateString()}`,
    totals: {
      totalLeads: Number(total.c),
      newThisMonth: Number(newLeads.c),
      auditsRun: Number(audited.c),
      opportunities: Number(ops.c),
      dealsWon: Number(won.c),
      revenueWon: Number(won.v),
    },
  };
}
