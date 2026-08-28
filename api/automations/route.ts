import { db } from "@/db";
import { automations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(automations).where(eq(automations.orgId, ORG_ID)).orderBy(desc(automations.createdAt));
  return Response.json({ automations: rows });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
  const [a] = await db.update(automations).set({ enabled: body.enabled }).where(eq(automations.id, body.id)).returning();
  return Response.json({ automation: a });
}
