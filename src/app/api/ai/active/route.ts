import { activeProviderLabel } from "@/lib/email-ai";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true, active: activeProviderLabel() });
}
