import { db } from "@/db";
import { leads, opportunities, messages } from "@/db/schema";
import { and, eq, inArray, desc, sql } from "drizzle-orm";
import { ORG_ID, logActivity, recordJob } from "@/lib/repo";
import { generateOutreach } from "@/lib/outreach";
import type { DetectedOpportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Generate personalized DRAFT outreach for many leads at once.
// Drafts are never sent automatically — they require approval (responsible outreach).
export async function POST(req: Request) {
  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
  const category: string | undefined = body.category;
  const service: string | undefined = body.service;
  const ids: number[] | undefined = body.leadIds;
  const limit = Math.min(200, body.limit || 50);

  const conds = [eq(leads.orgId, ORG_ID)];
  if (ids && ids.length) conds.push(inArray(leads.id, ids));
  if (category) conds.push(eq(leads.scoreCategory, category));
  if (service) conds.push(sql`${leads.recommendedServices} @> ${JSON.stringify([service])}::jsonb`);

  const targets = await db.select().from(leads).where(and(...conds)).orderBy(desc(leads.leadScore)).limit(limit);

  let created = 0;
  for (const lead of targets) {
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
      channel,
      direction: "outbound",
      subject: channel === "email" ? out.subject : null,
      body: channel === "whatsapp" ? out.whatsapp : out.email,
      status: "draft",
      aiGenerated: true,
      approved: false,
    });
    created++;
  }

  await logActivity("outreach", `Batch generated ${created} ${channel} drafts`);
  await recordJob("email_gen", `Batch outreach: ${created} drafts`, "completed", Date.now() - started);

  return Response.json({ created, channel, note: "Drafts created. Review & approve in Messages before sending." });
}
