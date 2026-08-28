import { db } from "@/db";
import { notes } from "@/db/schema";
import { ORG_ID, logActivity } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.leadId || !body.body) return Response.json({ error: "leadId and body required" }, { status: 400 });
  const [n] = await db.insert(notes).values({ leadId: body.leadId, body: body.body, author: body.author || "You" }).returning();
  await logActivity("note", "Note added", body.leadId);
  return Response.json({ note: n }, { status: 201 });
}
