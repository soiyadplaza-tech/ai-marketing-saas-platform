import { db } from "@/db";
import { leads, messages, suppressions } from "@/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { ORG_ID, logActivity, notify, recordJob } from "@/lib/repo";
import { configuredProvider, sendEmail } from "@/lib/mailer";
import { normalizeDailyLimit, quotaStatus } from "@/lib/email-limits";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Sends APPROVED email drafts only. It never sends unapproved AI drafts.
// It respects the daily hard cap (max 1500) and target baseline (400/day).
export async function POST(req: Request) {
  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const dailyLimit = normalizeDailyLimit(body.dailyLimit);
  const requestedLimit = Math.min(Number(body.limit || dailyLimit), dailyLimit);
  const provider = configuredProvider();

  if (provider === "none") {
    return Response.json(
      { error: "integration_required", message: "No email provider configured. Add RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_HOST." },
      { status: 409 }
    );
  }

  const quota = await quotaStatus(dailyLimit);
  const allowed = Math.max(0, Math.min(requestedLimit, quota.remainingToday));
  if (allowed <= 0) {
    return Response.json({ error: "daily_limit_reached", quota }, { status: 429 });
  }

  const msgIds: number[] | undefined = Array.isArray(body.messageIds) ? body.messageIds.map(Number).filter(Boolean) : undefined;
  const conds = [eq(messages.orgId, ORG_ID), eq(messages.channel, "email"), eq(messages.status, "approved"), eq(messages.approved, true)];
  if (msgIds && msgIds.length) conds.push(inArray(messages.id, msgIds));

  const candidates = await db.select().from(messages).where(and(...conds)).orderBy(desc(messages.createdAt)).limit(allowed);

  let sent = 0, skipped = 0, failed = 0;
  const errors: string[] = [];

  for (const m of candidates) {
    if (!m.leadId) { skipped++; continue; }
    const [lead] = await db.select().from(leads).where(eq(leads.id, m.leadId)).limit(1);
    if (!lead?.email) { skipped++; continue; }

    const suppressed = await db
      .select({ id: suppressions.id })
      .from(suppressions)
      .where(and(eq(suppressions.orgId, ORG_ID), eq(suppressions.email, lead.email)))
      .limit(1);
    if (suppressed.length) { skipped++; continue; }

    const result = await sendEmail({ to: lead.email, subject: m.subject || "A message from FOYSAL IT", text: m.body });
    if (!result.ok) {
      failed++;
      errors.push(`${lead.email}: ${result.error}`);
      // In provider test-mode errors (e.g. Resend unverified domain), stop to avoid repeated failures.
      if (failed >= 3) break;
      continue;
    }

    await db.update(messages).set({ status: "sent", sentAt: new Date() }).where(eq(messages.id, m.id));
    await db.update(leads).set({ lastContactedAt: new Date(), stage: lead.stage === "audited" ? "contacted" : lead.stage, updatedAt: new Date() }).where(eq(leads.id, lead.id));
    await logActivity("outreach", `Bulk email sent to ${lead.email} via ${provider}`, lead.id);
    sent++;
  }

  await recordJob("email_send", `Bulk approved send: ${sent} sent`, sent > 0 ? "completed" : failed > 0 ? "failed" : "completed", Date.now() - started, null, { sent, skipped, failed, provider });
  if (sent > 0) await notify("outreach_sent", "Bulk email send completed", `${sent} approved emails sent via ${provider}`);

  return Response.json({ provider, sent, skipped, failed, attempted: candidates.length, errors: errors.slice(0, 5), quota: await quotaStatus(dailyLimit) });
}
