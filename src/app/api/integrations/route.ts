import { db } from "@/db";
import { integrations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

const PROVIDERS = [
  "base44",
  "arena",
  "nova",
  "google_meet",
  "google_sheets",
  "email",
  "whatsapp",
  "ga",
  "gsc",
  "gbp",
  "google_ads",
  "meta",
  "crawler",
  "webhook",
];

// Detect which providers have server-side credentials available.
function envConfigured(provider: string): boolean {
  switch (provider) {
    case "base44":
      return !!(process.env.BASE44_APP_ID && process.env.BASE44_API_KEY);
    case "arena":
      return !!(process.env.ARENA_API_KEY || process.env.ARENA_APP_ID);
    case "nova":
      return true; // built-in NOVA AI (MyMemory translation + browser speech)
    case "google_meet":
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "email":
      return !!(process.env.SMTP_HOST || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
    case "whatsapp":
      return !!(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_KEY);
    case "google_sheets":
    case "ga":
    case "gsc":
    case "gbp":
    case "google_ads":
      return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case "meta":
      return !!process.env.META_ACCESS_TOKEN;
    case "crawler":
      return true; // built-in crawler is always available
    default:
      return false;
  }
}

export async function GET() {
  const rows = await db.select().from(integrations).where(eq(integrations.orgId, ORG_ID));
  const map = new Map(rows.map((r) => [r.provider, r]));
  const result = PROVIDERS.map((p) => {
    const existing = map.get(p);
    const hasEnv = envConfigured(p);
    let status = existing?.status || "disconnected";
    if (p === "crawler") status = "connected";
    else if (hasEnv && status === "disconnected") status = "connected";
    return {
      provider: p,
      status,
      envConfigured: hasEnv,
      lastTestedAt: existing?.lastTestedAt || null,
    };
  });
  return Response.json({ integrations: result });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { provider, action } = body;
  if (!PROVIDERS.includes(provider)) return Response.json({ error: "Unknown provider" }, { status: 400 });

  const [existing] = await db.select().from(integrations).where(and(eq(integrations.orgId, ORG_ID), eq(integrations.provider, provider)));

  if (action === "test") {
    let ok = envConfigured(provider);
    if (ok && provider === "base44") {
      const { pingBase44 } = await import("@/lib/base44");
      const p = await pingBase44();
      ok = p.ok;
    }
    const status = ok ? "connected" : "error";
    if (existing) {
      await db.update(integrations).set({ status, lastTestedAt: new Date() }).where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values({ orgId: ORG_ID, provider, status, lastTestedAt: new Date() });
    }
    return Response.json({
      provider,
      status,
      message: ok
        ? "Connection test succeeded."
        : "No credentials configured on the server. Add the required environment variables to connect.",
    });
  }

  if (action === "disconnect") {
    if (existing) await db.update(integrations).set({ status: "disconnected" }).where(eq(integrations.id, existing.id));
    return Response.json({ provider, status: "disconnected" });
  }

  // Email Robot: save SMTP/Gmail credentials (server-side, never returned in full).
  if (provider === "email" && action === "smtp_config") {
    const prev = (existing?.config || {}) as Record<string, string>;
    const cfg = {
      ...prev,
      ...(body.user ? { user: String(body.user).trim().toLowerCase() } : {}),
      ...(body.appPassword ? { appPassword: String(body.appPassword).replace(/\s+/g, "") } : {}),
      ...(body.host ? { host: String(body.host).trim() } : {}),
    };
    if (existing) {
      await db.update(integrations).set({ status: "disconnected", config: cfg }).where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values({ orgId: ORG_ID, provider: "email", status: "disconnected", config: cfg });
    }
    return Response.json({ ok: true, saved: true, user: cfg.user || null, hasPassword: !!cfg.appPassword });
  }

  // Email Robot: send a real test email through the configured provider.
  if (provider === "email" && action === "smtp_test") {
    const { sendEmail, getSmtpCredentials } = await import("@/lib/mailer");
    const creds = await getSmtpCredentials();
    const to = String(body.to || creds.user || "").toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return Response.json({ ok: false, error: "Provide a valid test recipient email." }, { status: 400 });
    }
    const result = await sendEmail({
      to,
      subject: "FOYSAL IT — mail robot test ✅",
      text: `This is a real test from the FOYSAL IT mail robot.\n\nSender: ${creds.user || "server"}\nTime: ${new Date().toISOString()}\n\nIf you can read this, the daily AI autopilot can send from here.\n\n— FOYSAL IT`,
    });
    const status = result.ok ? "connected" : "error";
    if (existing) await db.update(integrations).set({ status, lastTestedAt: new Date() }).where(eq(integrations.id, existing.id));
    else await db.insert(integrations).values({ orgId: ORG_ID, provider: "email", status, lastTestedAt: new Date() });
    if (result.ok) return Response.json({ ok: true, provider: result.provider, message: `Test email delivered to ${to} via ${result.provider}.` });
    return Response.json({ ok: false, error: result.error });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
