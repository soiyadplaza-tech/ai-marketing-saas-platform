import { db } from "@/db";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const platform = body.platform;

  if (!platform) return Response.json({ error: "Platform required" }, { status: 400 });

  const [integration] = await db.select().from(integrations).where(eq(integrations.orgId, ORG_ID)).limit(1);
  if (!integration || integration.status !== "connected") {
    return Response.json({ error: "Platform not connected", ok: false }, { status: 409 });
  }

  // Simulate sync - in production, call actual platform APIs
  const mockFollowers = Math.floor(Math.random() * 10000) + 500;
  
  await db.update(integrations).set({
    status: "connected",
    config: { ...(integration.config as any) || {}, followers: mockFollowers, lastSync: new Date().toISOString() },
    lastTestedAt: new Date(),
  }).where(eq(integrations.id, integration.id));

  return Response.json({ ok: true, followers: mockFollowers, platform });
}
