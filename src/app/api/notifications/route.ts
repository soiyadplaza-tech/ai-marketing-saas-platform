import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.orgId, ORG_ID))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  const unread = rows.filter((r) => !r.read).length;
  return Response.json({ notifications: rows, unread });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.id) {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, body.id), eq(notifications.orgId, ORG_ID)));
  } else {
    await db.update(notifications).set({ read: true }).where(eq(notifications.orgId, ORG_ID));
  }
  return Response.json({ ok: true });
}
