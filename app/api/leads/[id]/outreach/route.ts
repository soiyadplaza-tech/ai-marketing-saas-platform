import { db } from "@/db";
import { leads, opportunities, messages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ORG_ID, logActivity, recordJob } from "@/lib/repo";
import { generateOutreach } from "@/lib/outreach";
import type { DetectedOpportunity } from "@/lib/opportunities";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const started = Date.now();
  const { id } = await ctx.params;
  const leadId = parseInt(id);
  const body = await req.json().catch(() => ({}));
  const channel = body.channel === "whatsapp" ? "whatsapp" : "email";

  const [lead] = await db.select().from(leads).where(and(eq(leads.id, leadId), eq(leads.orgId, ORG_ID)));
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const ops = await db.select().from(opportunities).where(eq(opportunities.leadId, leadId));
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

  const bodyText = channel === "whatsapp" ? out.whatsapp : out.email;
  const [msg] = await db
    .insert(messages)
    .values({
      orgId: ORG_ID,
      leadId,
      channel,
      direction: "outbound",
      subject: channel === "email" ? out.subject : null,
      body: bodyText,
      status: "draft",
      aiGenerated: true,
      approved: false,
    })
    .returning();

  await logActivity("outreach", `Generated ${channel} draft`, leadId);
  await recordJob("email_gen", `Outreach: ${lead.company}`, "completed", Date.now() - started, leadId);

  return Response.json({ message: msg, outreach: out });
}
