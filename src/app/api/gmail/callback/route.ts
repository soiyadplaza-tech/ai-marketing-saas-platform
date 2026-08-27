import { exchangeCode, saveConnectedAccount, GMAIL_SCOPES } from "@/lib/gmail";

export const dynamic = "force-dynamic";

// Step 2 of OAuth: Google redirects back with ?code=&state=.
// We verify state, exchange the code for tokens (server-side), store them
// encrypted, and send the user back to the app.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const origin = originFromReq(req, url);

  if (error) {
    return jsonRedirect(origin, `Gmail authorization was cancelled or failed: ${error}`);
  }

  const cookieState = parseCookies(req.headers.get("cookie"))["gmail_oauth_state"];
  if (!state || state !== cookieState) {
    return Response.json({ error: "State mismatch. Please try connecting again." }, { status: 400 });
  }

  if (!code) {
    return Response.json({ error: "No authorization code received." }, { status: 400 });
  }

  try {
    const token = await exchangeCode(code, origin);
    const email: string = token.email || "unknown@gmail.com";
    await saveConnectedAccount(email, token, GMAIL_SCOPES.join(" "));
    return jsonRedirect(origin, "ok", { email });
  } catch (e) {
    return jsonRedirect(origin, e instanceof Error ? e.message : "Token exchange failed");
  }
}

function originFromReq(req: Request, url: URL): string {
  const fwd = req.headers.get("x-forwarded-host");
  if (fwd) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${fwd.split(",")[0]}`;
  }
  return url.origin;
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function jsonRedirect(origin: string, message: string, extra: Record<string, string> = {}) {
  const target = `${origin}/gmail?status=${encodeURIComponent(message)}&${Object.entries(extra)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&")}`;
  return new Response(null, { status: 302, headers: { Location: target } });
}
