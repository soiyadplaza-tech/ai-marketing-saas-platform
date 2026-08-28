import { db } from "@/db";
import { leads } from "@/db/schema";
import { and, eq, desc, sql, lte, isNotNull, count } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { interpretCommand } from "@/lib/command";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text) return Response.json({ error: "text required" }, { status: 400 });

  const intent = interpretCommand(text);
  const f = intent.filters;
  const conds = [eq(leads.orgId, ORG_ID)];
  if (f.category) conds.push(eq(leads.scoreCategory, f.category));
  if (f.service) conds.push(sql`${leads.recommendedServices} @> ${JSON.stringify([f.service])}::jsonb`);
  if (f.overdueFollowup) conds.push(isNotNull(leads.nextFollowUpAt), lte(leads.nextFollowUpAt, new Date()));
  if (f.stage) conds.push(eq(leads.stage, f.stage));

  const where = and(...conds);

  if (intent.action === "count") {
    const [c] = await db.select({ c: count() }).from(leads).where(where);
    return Response.json({ intent, resultType: "count", count: Number(c?.c ?? 0) });
  }

  const rows = await db.select().from(leads).where(where).orderBy(desc(leads.leadScore)).limit(50);

  // For missing-tracking filters we approximate using recommended services
  // (analytics recommendation => missing analytics; meta_ads => missing pixel).
  let filtered = rows;
  if (f.missingTracking === "meta_pixel") {
    filtered = rows.filter((r) => (r.recommendedServices || []).includes("meta_ads"));
  } else if (f.missingTracking === "analytics") {
    filtered = rows.filter((r) => (r.recommendedServices || []).includes("analytics"));
  }

  return Response.json({
    intent,
    resultType: intent.action,
    leads: filtered,
    count: filtered.length,
  });
}
