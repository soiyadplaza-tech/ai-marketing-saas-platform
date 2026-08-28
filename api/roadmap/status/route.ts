import { configuredProvider } from "@/lib/mailer";
import { resolveLlmProvider } from "@/lib/email-ai";

export const dynamic = "force-dynamic";

type Status = "live" | "working" | "setup_required" | "future" | "blocked";

async function probe(url: string) {
  try {
    const started = Date.now();
    const r = await fetch(url, { cache: "no-store" });
    return { ok: r.ok, status: r.status, latencyMs: Date.now() - started };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "network" };
  }
}

export async function GET() {
  const activeUrl = process.env.APP_BASE_URL || "https://foysalit-app.netlify.app";
  const customDomain = process.env.CUSTOM_DOMAIN || "foysalit.publicvm.com";
  const [active, custom] = await Promise.all([
    probe(`${activeUrl.replace(/\/$/, "")}/api/health`),
    probe(`https://${customDomain}/api/health`),
  ]);
  const mailProvider = configuredProvider();
  const llm = resolveLlmProvider();

  const modules: { area: string; status: Status; note: string; next?: string }[] = [
    { area: "Active Netlify app", status: active.ok ? "live" : "blocked", note: active.ok ? `${activeUrl} is live` : `Active app not reachable (${active.status})` },
    { area: "Custom domain foysalit.publicvm.com", status: custom.ok ? "live" : "setup_required", note: custom.ok ? "Custom domain is live" : "DNS/custom domain not connected yet", next: "Netlify → Domain management → add foysalit.publicvm.com → copy DNS records to DNSExit/PublicVM" },
    { area: "Database + schema", status: "live", note: "PostgreSQL + Drizzle bootstrap self-heal working" },
    { area: "Lead database", status: "live", note: "Google Sheet lead import and per-person profiles are working" },
    { area: "Website audit", status: "live", note: "Real HTML fetch + SEO/Local/Tracking audit working" },
    { area: "NOVA Meeting Translator", status: "live", note: "Browser STT + real translation API + TTS working" },
    { area: "AI Copilot", status: "working", note: llm ? `LLM provider active: ${llm.provider}` : "Built-in engines active; add OPENAI/Claude/Gemini key for LLM mode", next: "Add one AI API key in Netlify env if you want stronger open-ended answers" },
    { area: "Gmail SMTP mail robot", status: mailProvider !== "none" ? "live" : "setup_required", note: mailProvider !== "none" ? `Primary provider: ${mailProvider}` : "No mail provider configured", next: "Set GMAIL_USER + GMAIL_APP_PASSWORD in Netlify env" },
    { area: "Gmail OAuth inbox", status: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "working" : "setup_required", note: "Gmail API inbox needs Google OAuth web callback", next: `Add redirect URI: ${activeUrl.replace(/\/$/, "")}/api/gmail/callback` },
    { area: "Google Meet official integration", status: "setup_required", note: "Requires official Google OAuth/Calendar/Meet APIs; no fake links", next: "Enable Google Calendar API + add GOOGLE_CLIENT_ID/SECRET" },
    { area: "WhatsApp Business API", status: process.env.WHATSAPP_TOKEN ? "working" : "setup_required", note: "Requires official WhatsApp Business provider token", next: "Add WHATSAPP_TOKEN / WHATSAPP_API_KEY" },
    { area: "Billing/subscriptions", status: "future", note: "Stripe/payment provider not connected yet" },
    { area: "Play Store app", status: "future", note: "Current app is PWA/installable web app; Play Store requires Android build + developer account" },
    { area: "Full WebRTC video meeting", status: "future", note: "Needs WebRTC/SFU infrastructure. Current NOVA solves translation/captions now." },
  ];

  const live = modules.filter((m) => m.status === "live").length;
  const setup = modules.filter((m) => m.status === "setup_required").length;
  const future = modules.filter((m) => m.status === "future").length;

  return Response.json({ ok: true, activeUrl, customDomain, active, custom, summary: { live, setupRequired: setup, future }, modules });
}
