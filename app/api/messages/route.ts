import { db } from "@/db";
import { messages, leads, suppressions } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { ORG_ID, logActivity, notify } from "@/lib/repo";
import { sendEmail, configuredProvider } from "@/lib/mailer";
import { quotaStatus } from "@/lib/email-limits";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const conds = [eq(messages.orgId, ORG_ID)];
  if (status) conds.push(eq(messages.status, status));
  const rows = await db.select().from(messages).where(and(...conds)).orderBy(desc(messages.createdAt)).limit(200);
  // join lead company names
  const withLead = await Promise.all(
    rows.map(async (m) => {
      if (!m.leadId) return { ...m, company: null };
      const [l] = await db.select({ company: leads.company, email: leads.email }).from(leads).where(eq(leads.id, m.leadId));
      return { ...m, company: l?.company ?? null, leadEmail: l?.email ?? null };
    })
  );
  return Response.json({ messages: withLead });
}

// Approve / update message. Sending is only marked "sent" here because a real
// email/WhatsApp provider must be connected first (see Integrations).
export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });

  if (body.action === "approve") {
    const [m] = await db.update(messages).set({ approved: true, status: "approved" }).where(eq(messages.id, body.id)).returning();
    await logActivity("outreach", "Message approved", m?.leadId);
    return Response.json({ message: m });
  }
  if (body.action === "send") {
    const [m] = await db.select().from(messages).where(eq(messages.id, body.id));
    if (!m) return Response.json({ error: "Message not found" }, { status: 404 });
    if (!m.approved) return Response.json({ error: "Message must be approved before sending." }, { status: 400 });

    // WhatsApp sending still requires a connected WhatsApp Business API provider.
    if (m.channel === "whatsapp") {
      if (!process.env.WHATSAPP_TOKEN) {
        return Response.json(
          {
            error: "integration_required",
            message:
              "WhatsApp Business API is not connected. Add WHATSAPP_TOKEN in Integrations to enable real WhatsApp sending. The message stays approved and ready.",
          },
          { status: 409 }
        );
      }
    }

    // Resolve recipient from the lead.
    let recipient: string | null = null;
    let leadRow: typeof leads.$inferSelect | undefined;
    if (m.leadId) {
      [leadRow] = await db.select().from(leads).where(eq(leads.id, m.leadId));
      recipient = leadRow?.email ?? null;
    }
    if (!recipient) {
      return Response.json({ error: "This lead has no email address to send to." }, { status: 400 });
    }

    // Compliance: respect suppression / unsubscribe list.
    const suppressed = await db
      .select({ id: suppressions.id })
      .from(suppressions)
      .where(and(eq(suppressions.orgId, ORG_ID), eq(suppressions.email, recipient)))
      .limit(1);
    if (suppressed.length) {
      return Response.json({ error: "Recipient is on the suppression/unsubscribe list. Not sent." }, { status: 400 });
    }

    // Email channel — real send via configured provider.
    if (configuredProvider() === "none") {
      return Response.json(
        {
          error: "integration_required",
          message:
            "No email provider is configured. Add RESEND_API_KEY, SENDGRID_API_KEY, or SMTP_HOST in Integrations. The message stays approved and ready.",
        },
        { status: 409 }
      );
    }

    const quota = await quotaStatus();
    if (quota.remainingToday <= 0) {
      return Response.json({ error: "daily_limit_reached", message: "Daily email limit reached (max 1500/day).", quota }, { status: 429 });
    }

    const result = await sendEmail({
      to: recipient,
      subject: m.subject || `A message from FOYSAL IT`,
      text: m.body,
    });

    if (!result.ok) {
      return Response.json(
        { error: "send_failed", message: `Send failed via ${result.provider}: ${result.error}` },
        { status: 502 }
      );
    }

    const [updated] = await db
      .update(messages)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(messages.id, m.id))
      .returning();

    if (m.leadId) {
      await db
        .update(leads)
        .set({
          lastContactedAt: new Date(),
          stage: leadRow && leadRow.stage === "audited" ? "contacted" : leadRow?.stage,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, m.leadId));
    }

    await logActivity("outreach", `Email sent to ${recipient} via ${result.provider}`, m.leadId);
    await notify("outreach_sent", "Message sent", `Email delivered to ${recipient}`, m.leadId);

    return Response.json({ message: updated, provider: result.provider, sent: true });
  }
  if (body.action === "update") {
    const [m] = await db
      .update(messages)
      .set({ subject: body.subject, body: body.body })
      .where(eq(messages.id, body.id))
      .returning();
    return Response.json({ message: m });
  }
  if (body.action === "unsubscribe" && body.email) {
    await db.insert(suppressions).values({ orgId: ORG_ID, email: body.email, reason: "unsubscribe" });
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
