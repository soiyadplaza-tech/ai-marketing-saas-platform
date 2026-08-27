import { db } from "@/db";
import { leads, opportunities } from "@/db/schema";
import { and, eq, isNull, desc, sql } from "drizzle-orm";
import { ORG_ID, logActivity, recordJob, notify } from "@/lib/repo";
import { auditAndScoreLead } from "@/lib/run-audit";
import { generateOutreach } from "@/lib/outreach";
import { messages } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// AI Auto Work: one-click — audit top unaudited leads, score them, detect
// opportunities, and generate personalized outreach drafts. No emails are sent.
export async function POST(req: Request) {
  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(50, Number(body.limit) || 25);

  const targets = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, ORG_ID), isNull(leads.auditedAt), sql`${leads.website} IS NOT NULL`))
    .orderBy(desc(leads.leadScore))
    .limit(limit);

  let audited = 0, drafts = 0, auditedOk = 0, failed = 0;
  for (const lead of targets) {
    if (!lead.website) continue;
    try {
      const { ok } = await auditAndScoreLead(lead.id);
      if (ok) auditedOk++;
      audited++;
    } catch {
      failed++;
    }

    // Generate an outreach draft for this lead (draft only, not sent).
    try {
      const ops = await db.select().from(opportunities).where(eq(opportunities.leadId, lead.id));
      const detected = ops.map((o) => ({
        problem: o.problem, evidence: o.evidence || "", severity: (o.severity as any) || "medium",
        businessImpact: o.businessImpact || "", recommendedService: o.recommendedService as any,
        recommendedAction: o.recommendedAction || "", confidence: o.confidence || 70,
      }));
      const leadNow = await db.select().from(leads).where(eq(leads.id, lead.id)).then((r) => r[0]);
      const out = generateOutreach({
        company: leadNow.company, contactName: leadNow.contactName, website: leadNow.website,
        industry: leadNow.industry, location: leadNow.location, websiteScore: leadNow.websiteScore, opportunities: detected,
      });
      await db.insert(messages).values({
        orgId: ORG_ID, leadId: lead.id, channel: "email", direction: "outbound",
        subject: out.subject, body: out.email, status: "draft", aiGenerated: true, approved: false,
      });
      drafts++;
    } catch {
      /* non-fatal per lead */
    }
  }

  const message = `AI Auto Work: audited ${auditedOk} sites (${audited - auditedOk} failed), generated ${drafts} outreach drafts.`;
  await logActivity("auto_work", message, null, { audited: auditedOk, drafts, failed });
  await recordJob("auto_work", `Auto work: ${auditedOk} audited, ${drafts} drafts`, "completed", Date.now() - started, null, { audited: auditedOk, drafts, failed });
  await notify("auto_work", "AI Auto Work completed", message);

  return Response.json({ ok: true, message, audited: auditedOk, drafts, failed });
}
