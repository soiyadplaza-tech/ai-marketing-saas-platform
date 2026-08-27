import { resolve4, resolveCname, resolveMx, resolveTxt } from "dns/promises";
import { DOMAIN, APP_URL, cronAutopilotUrl } from "@/lib/domain";
import { configuredProvider, defaultFrom } from "@/lib/mailer";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

const RESEND_DOMAIN_ID = process.env.RESEND_DOMAIN_ID || "79226f5c-8684-455a-a072-a3801c42c2e0";

async function safeLookup<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

async function fetchResendDomain() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY not configured" as string, domain: null };
  const r = await fetch(`https://api.resend.com/domains/${RESEND_DOMAIN_ID}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: data?.message || `HTTP ${r.status}`, domain: null };
  return { ok: true, error: null as string | null, domain: data };
}

export async function GET() {
  const [a, www, mx, txt, resend] = await Promise.all([
    safeLookup(() => resolve4(DOMAIN), [] as string[]),
    safeLookup(async () => {
      try { return await resolveCname(`www.${DOMAIN}`); }
      catch { return await resolve4(`www.${DOMAIN}`); }
    }, [] as string[]),
    safeLookup(() => resolveMx(DOMAIN), [] as { exchange: string; priority: number }[]),
    safeLookup(() => resolveTxt(DOMAIN), [] as string[][]),
    fetchResendDomain(),
  ]);

  const records = Array.isArray(resend.domain?.records) ? resend.domain.records : [];
  const verified = resend.domain?.status === "verified";
  const from = defaultFrom();
  const fromUsesDomain = from.toLowerCase().includes(`@${DOMAIN}`);
  const primary = configuredProvider();
  const [emailIntegration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.orgId, ORG_ID), eq(integrations.provider, "email")))
    .limit(1)
    .catch(() => [] as any[]);
  const emailStatus = emailIntegration?.status || "not_tested";
  const ready = primary !== "none" && emailStatus === "connected";
  const mailRobot = {
    provider: primary,
    ready,
    status: emailStatus,
    primary: primary === "smtp" ? "Gmail SMTP (foysalahmed.dm23@gmail.com)" : primary === "resend" ? "Resend" : primary === "sendgrid" ? "SendGrid" : "none",
    backup: ["resend", "sendgrid"].filter((p) => p !== primary),
    note:
      ready
        ? `Mail robot tested and ready via ${primary === "smtp" ? "Gmail SMTP" : primary}.`
        : emailStatus === "error"
        ? "Mail provider is configured but the last real test failed. Generate a new 16-character Gmail app password in Google Account and save it in Domain → Email Robot."
        : primary === "smtp"
        ? "Gmail SMTP is configured but not verified in this deployment. Run Domain → Email Robot → Send test."
        : primary === "resend"
        ? "Resend is configured. Verify DNS or run a test before using autopilot."
        : "No primary mail provider ready. Add a Gmail app password or a Resend key.",
  };

  return Response.json({
    ok: true,
    domain: DOMAIN,
    appUrl: APP_URL,
    cronUrl: cronAutopilotUrl(),
    provider: configuredProvider(),
    mailFrom: from,
    fromUsesDomain,
    mailRobot,
    dns: {
      a,
      www,
      mx: mx.map((m) => `${m.priority} ${m.exchange}`),
      txt: txt.map((t) => t.join("")),
      resolved: a.length > 0,
    },
    resend: {
      configured: !!process.env.RESEND_API_KEY,
      status: resend.domain?.status || (resend.error ? "error" : "unknown"),
      region: resend.domain?.region || null,
      verified,
      error: resend.error,
      records,
    },
    readyToSend: verified && fromUsesDomain && configuredProvider() !== "none",
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = process.env.RESEND_API_KEY;
  if (!key) return Response.json({ ok: false, error: "RESEND_API_KEY not configured" }, { status: 409 });

  if (body.action === "verify") {
    const r = await fetch(`https://api.resend.com/domains/${RESEND_DOMAIN_ID}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return Response.json({ ok: false, error: data?.message || `HTTP ${r.status}` }, { status: 502 });
    return Response.json({ ok: true, status: data?.status || "pending", message: "Resend is re-checking foysalit.com DNS. This can take a few minutes after you save the records." });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
