import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Database health & size report for the admin Dashboard/Database page.
export async function GET() {
  const started = Date.now();
  await ensureSchema();

  const ping = Date.now() - started;

  const sizesRes = await db.execute(sql.raw(`
    SELECT t.relname AS name,
           pg_size_pretty(pg_total_relation_size(t.relid)) AS size,
           (SELECT s.n_live_tup FROM pg_stat_user_tables s WHERE s.schemaname='public' AND s.relname = t.relname) AS rowcount
    FROM pg_catalog.pg_statio_user_tables t
    WHERE t.schemaname='public'
    ORDER BY pg_total_relation_size(t.relid) DESC
  `)) as any;
  const sizes: { name: string; size: string; rows: number }[] = (sizesRes?.rows || sizesRes || []).map((r: any) => ({
    name: r.relname || r.name,
    size: r.size,
    rows: Number(r.rowcount ?? r.n_live_tup ?? r.rows ?? 0),
  }));

  const idxRes = await db.execute(sql.raw(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname='public' AND tablename='leads'
    ORDER BY indexname
  `)) as any;
  const idx: { indexname: string; indexdef: string }[] = idxRes?.rows || idxRes || [];

  const verRes = await db.execute(sql.raw(`SELECT version() AS v`)) as any;
  const versionRows: { v: string }[] = verRes?.rows || verRes || [];

  return Response.json({
    ok: true,
    pingMs: ping,
    version: versionRows[0]?.v || "",
    engine: "PostgreSQL (Neon serverless)",
    tables: sizes,
    leadIndexes: idx,
  });
}
