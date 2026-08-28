import { db } from "@/db";
import { leads, opportunities, activities, audits, messages } from "@/db/schema";
import { and, eq, desc, count, sql, lte, isNotNull } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { currentDataScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const scope = await currentDataScope();
  if (!scope.authenticated) return Response.json({ error: "Login required." }, { status: 401 });
  const orgId = scope.orgId;
  const org = eq(leads.orgId, orgId);

  const [totalRes, byCat, byStage, auditedRes, oppRes, dealRes] = await Promise.all([
    db.select({ c: count() }).from(leads).where(org),
    db.select({ cat: leads.scoreCategory, c: count() }).from(leads).where(org).groupBy(leads.scoreCategory),
    db.select({ stage: leads.stage, c: count() }).from(leads).where(org).groupBy(leads.stage),
    db.select({ c: count() }).from(leads).where(and(org, isNotNull(leads.auditedAt))),
    db.select({ c: count() }).from(opportunities).where(eq(opportunities.orgId, orgId)),
    db.select({ total: sql<number>`coalesce(sum(${leads.dealValue}),0)` }).from(leads).where(and(org, eq(leads.stage, "won"))),
  ]);

  const priorityLeads = await db
    .select()
    .from(leads)
    .where(org)
    .orderBy(desc(leads.leadScore))
    .limit(6);

  const now = new Date();
  const overdue = await db
    .select({ c: count() })
    .from(leads)
    .where(and(org, isNotNull(leads.nextFollowUpAt), lte(leads.nextFollowUpAt, now)));

  const recentActivity = await db
    .select()
    .from(activities)
    .where(eq(activities.orgId, orgId))
    .orderBy(desc(activities.createdAt))
    .limit(12);

  const topOpps = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.severity, "high")))
    .orderBy(desc(opportunities.confidence))
    .limit(6);

  const [msgStats] = await db
    .select({
      sent: sql<number>`count(*) filter (where ${messages.status} = 'sent')`,
      drafts: sql<number>`count(*) filter (where ${messages.status} = 'draft')`,
      replied: sql<number>`count(*) filter (where ${messages.status} = 'replied')`,
    })
    .from(messages)
    .where(eq(messages.orgId, orgId));

  const [auditAvg] = await db
    .select({ avg: sql<number>`coalesce(round(avg(${audits.overallScore})),0)` })
    .from(audits)
    .where(and(eq(audits.orgId, orgId), eq(audits.status, "completed")));

  const catMap: Record<string, number> = { cold: 0, warm: 0, hot: 0, priority: 0 };
  byCat.forEach((r) => { if (r.cat) catMap[r.cat] = Number(r.c); });
  const stageMap: Record<string, number> = {};
  byStage.forEach((r) => { stageMap[r.stage] = Number(r.c); });

  return Response.json({
    totalLeads: Number(totalRes[0]?.c ?? 0),
    categories: catMap,
    stages: stageMap,
    audited: Number(auditedRes[0]?.c ?? 0),
    opportunities: Number(oppRes[0]?.c ?? 0),
    wonRevenue: Number(dealRes[0]?.total ?? 0),
    overdueFollowUps: Number(overdue[0]?.c ?? 0),
    avgAuditScore: Number(auditAvg?.avg ?? 0),
    messages: {
      sent: Number(msgStats?.sent ?? 0),
      drafts: Number(msgStats?.drafts ?? 0),
      replied: Number(msgStats?.replied ?? 0),
    },
    priorityLeads,
    recentActivity,
    topOpportunities: topOpps,
  });
}
