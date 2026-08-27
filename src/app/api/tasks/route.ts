import { db } from "@/db";
import { tasks } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { ORG_ID, logActivity } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const conds = [eq(tasks.orgId, ORG_ID)];
  if (status) conds.push(eq(tasks.status, status));
  const rows = await db.select().from(tasks).where(and(...conds)).orderBy(desc(tasks.createdAt));
  return Response.json({ tasks: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const [t] = await db
    .insert(tasks)
    .values({
      orgId: ORG_ID,
      leadId: body.leadId || null,
      title: body.title,
      description: body.description,
      priority: body.priority || "medium",
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    })
    .returning();
  await logActivity("task", `Task created: ${t.title}`, t.leadId);
  return Response.json({ task: t }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const [t] = await db.update(tasks).set({ status: body.status }).where(eq(tasks.id, body.id)).returning();
  return Response.json({ task: t });
}
