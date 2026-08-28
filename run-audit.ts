import { db } from "@/db";
import { leads, audits, auditFindings, opportunities } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { runAudit, type AuditResult } from "./audit";
import { detectOpportunities, recommendedServicesFrom } from "./opportunities";
import { scoreLead } from "./scoring";
import { ORG_ID, logActivity, notify, recordJob } from "./repo";

// Runs a full audit + opportunity detection + scoring for a lead and persists it.
export async function auditAndScoreLead(leadId: number): Promise<{ audit: AuditResult; ok: boolean }> {
  const started = Date.now();
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.orgId, ORG_ID)));
  if (!lead) throw new Error("Lead not found");
  if (!lead.website) throw new Error("Lead has no website to audit");

  const result = await runAudit(lead.website);

  // Persist audit
  const [auditRow] = await db
    .insert(audits)
    .values({
      orgId: ORG_ID,
      leadId,
      url: result.url,
      status: result.ok ? "completed" : "failed",
      overallScore: result.overallScore,
      technicalScore: result.scores.technical,
      onpageScore: result.scores.onpage,
      performanceScore: result.scores.performance,
      conversionScore: result.scores.conversion,
      localScore: result.scores.local,
      socialScore: result.scores.social,
      data: result as unknown as Record<string, unknown>,
      error: result.error,
    })
    .returning();

  // Replace findings + opportunities for this lead
  await db.delete(auditFindings).where(eq(auditFindings.leadId, leadId));
  if (result.findings.length) {
    await db.insert(auditFindings).values(
      result.findings.map((f) => ({
        auditId: auditRow.id,
        leadId,
        category: f.category,
        title: f.title,
        detail: f.detail,
        severity: f.severity,
        passed: f.passed,
      }))
    );
  }

  const ops = result.ok ? detectOpportunities(result) : [];
  await db.delete(opportunities).where(eq(opportunities.leadId, leadId));
  if (ops.length) {
    await db.insert(opportunities).values(
      ops.map((o) => ({
        orgId: ORG_ID,
        leadId,
        problem: o.problem,
        evidence: o.evidence,
        severity: o.severity,
        businessImpact: o.businessImpact,
        recommendedService: o.recommendedService,
        recommendedAction: o.recommendedAction,
        confidence: o.confidence,
      }))
    );
  }

  const services = recommendedServicesFrom(ops);
  const sc = scoreLead(lead, result.ok ? result : null, ops);

  await db
    .update(leads)
    .set({
      leadScore: sc.score,
      scoreCategory: sc.category,
      scoreReasons: sc.reasons,
      websiteScore: sc.websiteScore,
      seoScore: sc.seoScore,
      localSeoScore: sc.localSeoScore,
      socialScore: sc.socialScore,
      recommendedServices: services,
      auditedAt: new Date(),
      enriched: true,
      stage: lead.stage === "new_lead" ? "audited" : lead.stage,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, leadId));

  await logActivity(
    "audited",
    result.ok
      ? `Website audit completed — score ${result.overallScore}/100, ${ops.length} opportunities`
      : `Website audit failed: ${result.error}`,
    leadId
  );
  await recordJob(
    "website_audit",
    `Audit: ${lead.company}`,
    result.ok ? "completed" : "failed",
    Date.now() - started,
    leadId,
    { score: result.overallScore, opportunities: ops.length },
    result.error
  );
  if (result.ok) {
    await notify("audit_complete", "Audit completed", `${lead.company}: score ${result.overallScore}/100, ${ops.length} opportunities`, leadId);
    if (sc.category === "priority") {
      await notify("priority_lead", "New priority lead", `${lead.company} is now a PRIORITY lead (${sc.score}/100)`, leadId);
    }
  }

  return { audit: result, ok: result.ok };
}
