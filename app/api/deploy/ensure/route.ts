import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { sql } from "drizzle-orm";
import { leads, users, organizations } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Production deploy verification + self-healing schema sync.
// Safe to call anytime (idempotent). On Vercel, point a post-deploy check or a
// one-off cron at this to guarantee the schema is present before traffic.
export async function GET() {
  const started = Date.now();
  const checks: Record<string, boolean> = {};

  try {
    await ensureSchema();
    checks.schema = true;

    const r = await db.execute(sql`select 1 from leads limit 1`);
    checks.leadsTable = r.rowCount != null ? true : (r.rows as unknown[]).length > 0;

    const [orgs] = await db.select({ c: count() }).from(organizations);
    checks.organization = Number(orgs?.c ?? 0) > 0;

    const [usersCount] = await db.select({ c: count() }).from(users);
    checks.adminUser = Number(usersCount?.c ?? 0) > 0;

    const [leadCount] = await db.select({ c: count() }).from(leads).where(eq(leads.orgId, 1));

    return Response.json({
      ok: true,
      environment: process.env.VERCEL ? "vercel" : "sandbox",
      region: process.env.VERCEL_REGION || null,
      db: "neon-postgres",
      checks,
      leads: Number(leadCount?.c ?? 0),
      ready: Object.values(checks).every(Boolean),
      durationMs: Date.now() - started,
      message: "Production database ready and schema in sync.",
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "ensure failed", checks },
      { status: 500 }
    );
  }
}
