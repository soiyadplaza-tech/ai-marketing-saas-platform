import { db } from "@/db";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const platform = body.platform;

  if (!platform) return Response.json({ error: "Platform required" }, { status: 400 });

  // For now, simulate OAuth flow - in production, redirect to real OAuth URLs
  const authUrls: Record<string, string> = {
    facebook: "https://www.facebook.com/v18.0/dialog/oauth",
    instagram: "https://api.instagram.com/oauth/authorize",
    tiktok: "https://www.tiktok.com/v2/auth/authorize",
    linkedin: "https://www.linkedin.com/oauth/v2/authorization",
    youtube: "https://accounts.google.com/o/oauth2/v2/auth",
    twitter: "https://twitter.com/i/oauth2/authorize",
  };

  const authUrl = authUrls[platform] || "#";
  
  // Create pending integration record
  await db.insert(integrations).values({
    orgId: ORG_ID,
    provider: platform,
    status: "disconnected",
    config: { authUrl, step: "oauth_pending" },
  }).onConflictDoUpdate({
    target: [integrations.orgId, integrations.provider],
    set: { status: "disconnected", config: { authUrl, step: "oauth_pending" } },
  });

  return Response.json({ authUrl, message: "OAuth flow initiated. In production, this redirects to the platform's authorization page." });
}
