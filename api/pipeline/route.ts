import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { currentDataScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const STAGES = [
  "new_lead",
  "researching",
  "audited",
  "qualified",
  "contacted",
  "replied",
  "interested",
  "meeting_booked",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export async function GET() {
  const scope = await currentDataScope();
  if (!scope.authenticated) return Response.json({ error: "Login required." }, { status: 401 });
  const rows = await db
    .select()
    .from(leads)
    .where(eq(leads.orgId, scope.orgId))
    .orderBy(desc(leads.leadScore))
    .limit(500);

  const grouped: Record<string, typeof rows> = {};
  for (const s of STAGES) grouped[s] = [];
  for (const r of rows) {
    const s = STAGES.includes(r.stage as (typeof STAGES)[number]) ? r.stage : "new_lead";
    grouped[s].push(r);
  }
  return Response.json({ stages: STAGES, grouped });
}
