import { db } from "@/db";
import { leads, audits, auditFindings, opportunities, messages, tasks, notes, activities } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { ORG_ID, logActivity } from "@/lib/repo";

export const dynamic = "force-dynamic";

async function getId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return parseInt(id);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await getId(ctx);
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.orgId, ORG_ID)));
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const [auditRows, oppRows, msgRows, taskRows, noteRows, actRows] = await Promise.all([
    db.select().from(audits).where(eq(audits.leadId, id)).orderBy(desc(audits.createdAt)).limit(1),
    db.select().from(opportunities).where(eq(opportunities.leadId, id)).orderBy(desc(opportunities.severity)),
    db.select().from(messages).where(eq(messages.leadId, id)).orderBy(desc(messages.createdAt)),
    db.select().from(tasks).where(eq(tasks.leadId, id)).orderBy(desc(tasks.createdAt)),
    db.select().from(notes).where(eq(notes.leadId, id)).orderBy(desc(notes.createdAt)),
    db.select().from(activities).where(eq(activities.leadId, id)).orderBy(desc(activities.createdAt)).limit(50),
  ]);

  let findings: (typeof auditFindings.$inferSelect)[] = [];
  if (auditRows[0]) {
    findings = await db.select().from(auditFindings).where(eq(auditFindings.auditId, auditRows[0].id));
  }

  return Response.json({
    lead,
    audit: auditRows[0] || null,
    findings,
    opportunities: oppRows,
    messages: msgRows,
    tasks: taskRows,
    notes: noteRows,
    activities: actRows,
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await getId(ctx);
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  const fields = [
    "company", "contactName", "email", "phone", "whatsapp", "website", "industry",
    "location", "status", "stage", "dealValue", "tags", "assignedUserId",
  ];
  for (const f of fields) if (f in body) allowed[f] = body[f];
  if ("nextFollowUpAt" in body) allowed.nextFollowUpAt = body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : null;
  if ("expectedCloseDate" in body) allowed.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null;
  allowed.updatedAt = new Date();

  const [updated] = await db
    .update(leads)
    .set(allowed)
    .where(and(eq(leads.id, id), eq(leads.orgId, ORG_ID)))
    .returning();
  if (!updated) return Response.json({ error: "Lead not found" }, { status: 404 });

  if ("stage" in body) {
    await logActivity("stage_change", `Stage changed to ${body.stage}`, id, { stage: body.stage });
  }
  return Response.json({ lead: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = await getId(ctx);
  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.orgId, ORG_ID)));
  return Response.json({ ok: true });
}
