import { getStatus } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getStatus();
  return Response.json(status);
}
