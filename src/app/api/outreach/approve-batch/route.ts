import { db } from "@/db";
import { messages } from "@/db/schema";
import { and, eq, asc, count } from "drizzle-orm";
import { ORG_ID, logActivity, notify, recordJob } from "@/lib/repo";

export const dynamic = "force-dynamic";

// Approves a SMALL batch of drafts at a time (default 10, hard cap 50) so the
// team reviews and approves outreach in controlled chunks — never all at once.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const requested = Number(body.limit || 10);
  const limit = Math.max(1, Math.min(50, Math.floor(requested)));

  const candidates = await db
    .select()
    .from(messages)
    .where(and(eq(messages.orgId, ORG_ID), eq(messages.status, "draft")))
    .orderBy(asc(messages.createdAt))
    .limit(limit);

  let approved = 0;
  for (const m of candidates) {
    await db.update(messages).set({ approved: true, status: "approved" }).where(eq(messages.id, m.id));
    approved++;
  }

  await logActivity("outreach", `Approved ${approved} message(s) in a small batch`);
  if (approved > 0) await recordJob("email_approve", `Small-batch approval: ${approved} draft(s)`, "completed", 0, null, { approved, limit });
  if (approved > 0) await notify("outreach_approved", "Drafts approved", `${approved} message(s) approved and ready to send.`);

  // Report how many drafts remain so the UI can show progress.
  const [rem] = await db.select({ n: count() }).from(messages).where(and(eq(messages.orgId, ORG_ID), eq(messages.status, "draft")));

  return Response.json({ approved, limit, remainingDrafts: Number(rem?.n ?? 0) });
}
