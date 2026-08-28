import { randomBytes } from "crypto";
import { buildAuthUrl, gmailConfigured } from "@/lib/gmail";

export const dynamic = "force-dynamic";

// Step 1 of OAuth: user lands here, we redirect to Google consent with a
// signed state (stored in an httpOnly cookie) to prevent CSRF.
export async function GET(req: Request) {
  if (!gmailConfigured()) {
    return Response.json(
      {
        error: "integration_required",
        message:
          "Gmail OAuth is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (from Google Cloud Console → Credentials → OAuth client ID, type Web application) in the server environment, then retry.",
      },
      { status: 409 }
    );
  }
  // Use the public origin (behind a proxy/CDN) so the OAuth redirect matches
  // the domain the user actually sees — critical for the registered redirect URI.
  const fwdHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
  const fwdProto = req.headers.get("x-forwarded-proto") || (new URL(req.url).protocol || "https:").replace(/:$/, "");
  const origin = `${fwdProto}://${fwdHost.split(",")[0]}`;
  const state = randomBytes(16).toString("hex");
  const url = buildAuthUrl(origin, state);
  const res = new Response(null, {
    status: 302,
    headers: {
      Location: url,
      "Set-Cookie": `gmail_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
  return res;
}
