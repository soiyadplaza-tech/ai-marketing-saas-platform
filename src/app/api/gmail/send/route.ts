import { sendMail, getAccessToken } from "@/lib/gmail";
import { db } from "@/db";
import { suppressions, emailActivity } from "@/db/schema";
import { and, eq, gte, count } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { EMAIL_DAILY_MIN_TARGET, EMAIL_DAILY_MAX_LIMIT } from "@/lib/email-limits";

export const dynamic = "force-dynamic";

// Real send through the Gmail API. Shows success ONLY after Gmail confirms.
// Safety: suppression list, daily cap (400–1500), duplicate prevention,
// and full activity logging (lead id, recipient, subject, thread, AI flag).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const to = String(body.to || "").trim().toLowerCase();
  const subject = String(body.subject || "(no subject)").trim();
  const text = String(body.body || "");
  const threadId: string | undefined = body.threadId;
  const inReplyTo: string | undefined = body.inReplyTo;
  const leadId: number | undefined = body.leadId;
  const aiGenerated = !!body.aiGenerated;

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return Response.json({ ok: false, error: "Invalid recipient email." }, { status: 400 });
  }
  if (!text.trim()) {
    return Response.json({ ok: false, error: "Email body is empty." }, { status: 400 });
  }

  const auth = await getAccessToken().catch(() => null);
  if (!auth) {
    return Response.json({ ok: false, error: "Gmail is not connected. Connect Gmail first." }, { status: 409 });
  }

  // Suppression / unsubscribe list.
  const suppressed = await db
    .select({ id: suppressions.id })
    .from(suppressions)
    .where(and(eq(suppressions.orgId, ORG_ID), eq(suppressions.email, to)))
    .limit(1);
  if (suppressed.length) {
    return Response.json({ ok: false, error: "Recipient is on the suppression/unsubscribe list. Send blocked." }, { status: 409 });
  }

  // Daily cap (1500 hard max; target 400 is the minimum ambition).
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [capRow] = await db
    .select({ c: count() })
    .from(emailActivity)
    .where(and(eq(emailActivity.orgId, ORG_ID), eq(emailActivity.action, "sent"), gte(emailActivity.createdAt, todayStart)));
  const sentToday = Number(capRow?.c ?? 0);
  if (sentToday >= EMAIL_DAILY_MAX_LIMIT) {
    return Response.json({ ok: false, error: `Daily limit reached (${EMAIL_DAILY_MAX_LIMIT} max). Try again tomorrow.` }, { status: 429 });
  }

  // Duplicate prevention: same recipient+subject within the last hour.
  const hourAgo = new Date(Date.now() - 3600 * 1000);
  const [dup] = await db
    .select({ id: emailActivity.id })
    .from(emailActivity)
    .where(and(eq(emailActivity.orgId, ORG_ID), eq(emailActivity.action, "sent"), eq(emailActivity.recipient, to), eq(emailActivity.subject, subject), gte(emailActivity.createdAt, hourAgo)))
    .limit(1);
  if (dup) {
    return Response.json({ ok: false, error: "Duplicate prevented: the same email to this recipient was already sent within the last hour." }, { status: 409 });
  }

  try {
    const result = await sendMail({ to, subject, body: text, threadId, inReplyTo });
    // Real success — Gmail confirmed the send.
    await db.insert(emailActivity).values({
      orgId: ORG_ID,
      gmailEmail: auth.email,
      leadId: leadId ?? null,
      recipient: to,
      subject,
      action: threadId || inReplyTo ? "reply" : "sent",
      gmailMessageId: result.id,
      gmailThreadId: result.threadId,
      aiGenerated,
      status: "ok",
    });
    return Response.json({
      ok: true,
      message: "Email sent successfully via Gmail API.",
      gmailMessageId: result.id,
      threadId: result.threadId,
      sentToday: sentToday + 1,
      dailyCap: EMAIL_DAILY_MAX_LIMIT,
      dailyTarget: EMAIL_DAILY_MIN_TARGET,
    });
  } catch (e: any) {
    await db.insert(emailActivity).values({
      orgId: ORG_ID,
      gmailEmail: auth.email,
      leadId: leadId ?? null,
      recipient: to,
      subject,
      action: "error",
      aiGenerated,
      status: "failed",
      detail: e?.message || "Gmail send failed",
    });
    return Response.json({ ok: false, error: e?.message || "Gmail send failed" }, { status: e?.status || 502 });
  }
}
