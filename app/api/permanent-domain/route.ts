import { publicAppUrl, cronAutopilotUrl, DOMAIN } from "@/lib/domain";

export const dynamic = "force-dynamic";

async function probe(url: string) {
  try {
    const started = Date.now();
    const r = await fetch(url, { method: "GET", cache: "no-store", redirect: "manual" });
    return { ok: r.status >= 200 && r.status < 400, status: r.status, latencyMs: Date.now() - started };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "network error" };
  }
}

export async function GET() {
  const domain = DOMAIN;
  const netlify = "https://foysalit-app.netlify.app";
  const custom = `https://${domain}`;
  const [netlifyHealth, customHealth] = await Promise.all([
    probe(`${netlify}/api/health`),
    probe(`${custom}/api/health`),
  ]);

  return Response.json({
    ok: true,
    productionDomain: domain,
    appBaseUrl: publicAppUrl(),
    cronUrl: cronAutopilotUrl(),
    netlify: {
      url: netlify,
      health: netlifyHealth,
      note: "This is the permanent Netlify project URL. It works even before custom DNS is ready.",
    },
    customDomain: {
      url: custom,
      health: customHealth,
      requiredDns: {
        provider: "DNSExit / PublicVM",
        record: "A",
        host: "foysalit.publicvm.com",
        currentIpShownByUser: "162.120.184.227",
        routerPublicIpShownByUser: "103.154.160.14",
        note: "For Netlify custom domain, DNS should usually point to Netlify, not your router IP. In Netlify Domains screen, use the exact A/CNAME records Netlify shows.",
      },
    },
    nextSteps: [
      "In Netlify, add custom domain: foysalit.publicvm.com.",
      "Netlify will show the correct DNS records. Copy those into DNSExit / PublicVM.",
      "Enable HTTPS/SSL in Netlify domain settings.",
      "Set Netlify env APP_BASE_URL and NEXT_PUBLIC_SITE_URL to https://foysalit.publicvm.com.",
      "Add Google OAuth redirect URI: https://foysalit.publicvm.com/api/gmail/callback.",
    ],
  });
}
