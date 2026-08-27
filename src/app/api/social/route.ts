import { db } from "@/db";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const all = await db.select().from(integrations).where(eq(integrations.orgId, ORG_ID));
  const byProvider = Object.fromEntries(all.map((i) => [i.provider, i]));

  const accounts = [
    { id: 1, platform: "facebook", handle: (byProvider.facebook?.config as any)?.handle || null, followers: Number((byProvider.facebook?.config as any)?.followers || 0), connected: byProvider.facebook?.status === "connected", lastSync: byProvider.facebook?.lastTestedAt },
    { id: 2, platform: "instagram", handle: (byProvider.instagram?.config as any)?.handle || null, followers: Number((byProvider.instagram?.config as any)?.followers || 0), connected: byProvider.instagram?.status === "connected", lastSync: byProvider.instagram?.lastTestedAt },
    { id: 3, platform: "tiktok", handle: (byProvider.tiktok?.config as any)?.handle || null, followers: Number((byProvider.tiktok?.config as any)?.followers || 0), connected: byProvider.tiktok?.status === "connected", lastSync: byProvider.tiktok?.lastTestedAt },
    { id: 4, platform: "linkedin", handle: (byProvider.linkedin?.config as any)?.handle || null, followers: Number((byProvider.linkedin?.config as any)?.followers || 0), connected: byProvider.linkedin?.status === "connected", lastSync: byProvider.linkedin?.lastTestedAt },
    { id: 5, platform: "youtube", handle: (byProvider.youtube?.config as any)?.handle || null, followers: Number((byProvider.youtube?.config as any)?.followers || 0), connected: byProvider.youtube?.status === "connected", lastSync: byProvider.youtube?.lastTestedAt },
    { id: 6, platform: "twitter", handle: (byProvider.twitter?.config as any)?.handle || null, followers: Number((byProvider.twitter?.config as any)?.followers || 0), connected: byProvider.twitter?.status === "connected", lastSync: byProvider.twitter?.lastTestedAt },
  ];

  return Response.json({ accounts });
}
