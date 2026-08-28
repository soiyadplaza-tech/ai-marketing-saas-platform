import { db } from "@/db";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = body.id;

  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  await db.update(integrations).set({
    status: "disconnected",
    config: {},
    lastTestedAt: null,
  }).where(eq(integrations.id, id));

  return Response.json({ ok: true });
}
