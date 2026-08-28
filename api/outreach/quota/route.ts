import { quotaStatus } from "@/lib/email-limits";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = url.searchParams.get("dailyLimit");
  return Response.json(await quotaStatus(limit ? Number(limit) : undefined));
}
