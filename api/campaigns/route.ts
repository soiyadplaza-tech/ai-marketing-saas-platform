import { db } from "@/db";
import { campaigns, campaignSteps } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ORG_ID, logActivity } from "@/lib/repo";
import { normalizeDailyLimit } from "@/lib/email-limits";

export const dynamic = "force-dynamic";

const DEFAULT_STEPS = [
  { dayOffset: 1, subject: "Initial personalized email", body: "Day 1 — AI-personalized intro referencing detected opportunities." },
  { dayOffset: 3, subject: "Quick follow-up", body: "Day 3 — gentle follow-up offering the free mini-audit." },
  { dayOffset: 6, subject: "A value-based idea", body: "Day 6 — share one concrete improvement idea." },
  { dayOffset: 10, subject: "Additional insight", body: "Day 10 — competitor/industry insight." },
  { dayOffset: 15, subject: "Final follow-up", body: "Day 15 — last check-in before closing the loop." },
];

export async function GET() {
  const rows = await db.select().from(campaigns).where(eq(campaigns.orgId, ORG_ID)).orderBy(desc(campaigns.createdAt));
  const withSteps = await Promise.all(
    rows.map(async (c) => {
      const steps = await db.select().from(campaignSteps).where(eq(campaignSteps.campaignId, c.id)).orderBy(campaignSteps.dayOffset);
      return { ...c, steps };
    })
  );
  return Response.json({ campaigns: withSteps });
}

export async function POST(req: Request) {
  const body = await req.json();
  const [c] = await db
    .insert(campaigns)
    .values({
      orgId: ORG_ID,
      name: body.name || "New Campaign",
      channel: body.channel === "whatsapp" ? "whatsapp" : "email",
      status: "draft",
      dailyLimit: normalizeDailyLimit(body.dailyLimit),
      targetFilter: body.targetFilter || {},
      leadCount: body.leadCount || 0,
    })
    .returning();

  const steps = body.steps && body.steps.length ? body.steps : DEFAULT_STEPS;
  await db.insert(campaignSteps).values(
    steps.map((s: { dayOffset: number; subject: string; body: string }, i: number) => ({
      campaignId: c.id,
      dayOffset: s.dayOffset,
      channel: c.channel,
      subject: s.subject,
      body: s.body,
      orderIndex: i,
    }))
  );

  await logActivity("campaign", `Campaign created: ${c.name}`);
  return Response.json({ campaign: c }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
  const [updated] = await db
    .update(campaigns)
    .set({ status: body.status })
    .where(eq(campaigns.id, body.id))
    .returning();
  return Response.json({ campaign: updated });
}
