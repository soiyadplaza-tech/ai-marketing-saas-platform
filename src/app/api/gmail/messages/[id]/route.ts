import { getMessage, markRead } from "@/lib/gmail";
import { db } from "@/db";
import { emailActivity } from "@/db/schema";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

function b64url(s: string): string {
  try {
    return Buffer.from(s || "", "base64url").toString("utf8");
  } catch {
    return "";
  }
}

function walkParts(payload: any, out: { headers: Record<string, string>; text: string; html: string; attachments: string[] }) {
  if (!payload) return;
  for (const h of payload.headers || []) out.headers[h.name.toLowerCase()] = h.value;
  if (payload.body?.data) {
    const content = b64url(payload.body.data);
    if ((payload.mimeType || "").includes("html")) out.html += content;
    else out.text += content;
  }
  if (payload.filename) out.attachments.push(payload.filename);
  for (const p of payload.parts || []) walkParts(p, out);
}

function stripHtml(html: string): string {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const raw = await getMessage(id);
    const out = { headers: {} as Record<string, string>, text: "", html: "", attachments: [] as string[] };
    walkParts(raw.payload, out);
    const bodyText = out.text || stripHtml(out.html);

    return Response.json({
      ok: true,
      id: raw.id,
      threadId: raw.threadId,
      labelIds: raw.labelIds,
      subject: out.headers.subject || "",
      from: out.headers.from || "",
      to: out.headers.to || "",
      date: out.headers.date || null,
      hasAttachments: (out.attachments || []).length > 0,
      attachments: out.attachments,
      body: bodyText.slice(0, 20000),
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Failed to fetch message" }, { status: e?.status || 500 });
  }
}

// PATCH: mark as read (only if the label is currently UNREAD).
export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const raw = await getMessage(id);
    if ((raw.labelIds || []).includes("UNREAD")) {
      await markRead(id);
      await db.insert(emailActivity).values({ orgId: ORG_ID, action: "read", gmailMessageId: id, status: "ok" });
      return Response.json({ ok: true, markedRead: true });
    }
    return Response.json({ ok: true, markedRead: false, alreadyRead: true });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Failed to mark read" }, { status: e?.status || 500 });
  }
}
