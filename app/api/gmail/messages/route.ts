import { listMessages, getAccessToken } from "@/lib/gmail";
import { db } from "@/db";
import { emailActivity } from "@/db/schema";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

// GET /api/gmail/messages?q=from%3Afoo&label=INBOX&max=25
// Returns a lightweight list (id, threadId, snippet, timestamp) — no bodies.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || undefined;
    const label = url.searchParams.get("label") || undefined;
    const max = Number(url.searchParams.get("max") || 25);
    const pageToken = url.searchParams.get("pageToken") || undefined;

    const labelIds = label ? [label] : undefined;
    const data = await listMessages({ q, labelIds, max, pageToken });

    return Response.json({
      ok: true,
      resultSize: data.resultSize,
      nextPageToken: data.nextPageToken || null,
      messages: (data.messages || []).map((m: any) => ({
        id: m.id,
        threadId: m.threadId,
        snippet: m.snippet,
        timestamp: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : null,
        labels: m.labelIds || [],
      })),
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "Failed to list messages" }, { status: e?.status || 500 });
  }
}

// Activity tracking is fire-and-forget.
export async function logView(gmailEmail: string | undefined, messageId: string) {
  try {
    const auth = await getAccessToken().catch(() => null);
    await db.insert(emailActivity).values({
      orgId: ORG_ID,
      gmailEmail: auth?.email || gmailEmail,
      action: "view",
      gmailMessageId: messageId,
      status: "ok",
    });
  } catch {
    /* non-fatal */
  }
}
