import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSchema();
    await db.execute(sql`select 1 from leads limit 1`);
    return Response.json({ ok: true, schema: "ready" });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "health failed" }, { status: 500 });
  }
}
