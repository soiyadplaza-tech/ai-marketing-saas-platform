import { disconnect, getStatus } from "@/lib/gmail";

export const dynamic = "force-dynamic";

// Revoke the Google token (best-effort) and mark the account disconnected.
export async function POST() {
  await disconnect();
  const status = await getStatus();
  return Response.json({ ok: true, connected: status.connected, message: "Gmail disconnected. Token revoked and local access state cleared." });
}
