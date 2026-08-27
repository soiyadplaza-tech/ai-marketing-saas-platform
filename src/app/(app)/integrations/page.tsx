"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

interface Integ { provider: string; status: string; envConfigured: boolean; lastTestedAt: string | null; }

const META: Record<string, { name: string; icon: string; desc: string; env: string }> = {
  base44: { name: "Base44 DataSheet Hub", icon: "🗂️", desc: "Master lead spreadsheet — real import & sync.", env: "BASE44_APP_ID / BASE44_API_KEY" },
  nova: { name: "NOVA AI (in-app)", icon: "🎙️", desc: "Built-in AI: translation, STT, TTS, meeting intelligence.", env: "Built-in (MyMemory + browser speech)" },
  google_meet: { name: "Google Meet", icon: "🎥", desc: "Create meetings + NOVA AI voice in meetings.", env: "GOOGLE_CLIENT_ID / SECRET (OAuth)" },
  crawler: { name: "Website Crawler", icon: "🕷️", desc: "Built-in real website auditing engine.", env: "Always available" },
  arena: { name: "Arena.ai", icon: "🏆", desc: "AI model leaderboards — import AI companies as leads.", env: "ARENA_API_KEY" },
  google_sheets: { name: "Google Sheets", icon: "📊", desc: "Import leads directly from spreadsheets.", env: "GOOGLE_CLIENT_ID / SECRET" },
  email: { name: "Email Provider", icon: "✉️", desc: "Send outreach via SMTP / Resend / SendGrid.", env: "SMTP_HOST or RESEND_API_KEY" },
  whatsapp: { name: "WhatsApp Business API", icon: "💬", desc: "Send approved template messages.", env: "WHATSAPP_TOKEN" },
  ga: { name: "Google Analytics", icon: "📈", desc: "Pull traffic & conversion data.", env: "GOOGLE_CLIENT_ID / SECRET" },
  gsc: { name: "Google Search Console", icon: "🔎", desc: "Import search performance data.", env: "GOOGLE_CLIENT_ID / SECRET" },
  gbp: { name: "Google Business Profile", icon: "📍", desc: "Local SEO & reviews data.", env: "GOOGLE_CLIENT_ID / SECRET" },
  google_ads: { name: "Google Ads", icon: "🎯", desc: "Ad account performance.", env: "GOOGLE_CLIENT_ID / SECRET" },
  meta: { name: "Meta (Facebook/Instagram)", icon: "📣", desc: "Ads & pixel insights.", env: "META_ACCESS_TOKEN" },
  webhook: { name: "Webhooks", icon: "🔗", desc: "Push events to external systems.", env: "Configure endpoint" },
};

// Additional providers requested but requiring their own credentials/OAuth.
// Shown honestly as "Integration Required" — never simulated as connected.
const EXTERNAL_CATALOG: { name: string; icon: string; desc: string; env: string }[] = [
  { name: "Google Calendar", icon: "📆", desc: "Schedule review sessions & sync meeting links.", env: "GOOGLE_CLIENT_ID / SECRET" },
  { name: "Google Slides", icon: "📑", desc: "Export KPI decks & presentation reports.", env: "GOOGLE_CLIENT_ID / SECRET" },
  { name: "Google Forms", icon: "📝", desc: "Client intake & feedback form capture.", env: "GOOGLE_CLIENT_ID / SECRET" },
  { name: "Google Drive / Workspace", icon: "🗄️", desc: "Shared gallery, albums & workspace files.", env: "GOOGLE_CLIENT_ID / SECRET" },
  { name: "LinkedIn", icon: "in", desc: "Share reports & KPI highlights to your network.", env: "LINKEDIN_CLIENT_ID / SECRET" },
  { name: "Stripe", icon: "💳", desc: "Subscriptions, checkout & customer portal.", env: "STRIPE_SECRET_KEY" },
  { name: "GitHub", icon: "🐙", desc: "Track repos, PRs & issues on the dashboard.", env: "GITHUB_TOKEN" },
  { name: "YouTube Analytics", icon: "▶️", desc: "Video performance & follower growth.", env: "GOOGLE_CLIENT_ID / SECRET" },
  { name: "Mailchimp", icon: "🐵", desc: "Sync audiences & campaign automations.", env: "MAILCHIMP_API_KEY" },
  { name: "BigQuery / Warehouse", icon: "🏢", desc: "Aggregate KPIs & run complex dataset queries.", env: "GOOGLE_CLIENT_ID / SECRET" },
  { name: "Slack / On-call", icon: "🔔", desc: "Incident alerts & on-call schedules.", env: "SLACK_WEBHOOK_URL" },
];

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integ[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ p: string; text: string; ok: boolean } | null>(null);

  async function load() {
    const r = await fetch("/api/integrations");
    const d = await r.json();
    setItems(d.integrations || []);
  }
  useEffect(() => { load(); }, []);

  async function test(provider: string) {
    setTesting(provider); setMsg(null);
    const r = await fetch("/api/integrations", { method: "PATCH", body: JSON.stringify({ provider, action: "test" }) });
    const d = await r.json();
    setMsg({ p: provider, text: d.message, ok: d.status === "connected" });
    setTesting(null); load();
  }

  async function importArena() {
    setTesting("arena"); setMsg(null);
    const r = await fetch("/api/integrations/arena", { method: "POST", body: JSON.stringify({ action: "import", limit: 100 }) });
    const d = await r.json();
    setMsg({ p: "arena", text: d.ok ? `Imported ${d.inserted} AI leads from Arena.ai` : d.error, ok: !!d.ok });
    setTesting(null); load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-slate-500">Connect providers to unlock imports & sending. Secrets stay server-side — never in the browser.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const m = META[it.provider];
          if (!m) return null;
          return (
            <Card key={it.provider} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{m.icon}</div>
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.desc}</div>
                  </div>
                </div>
                <Badge className={it.status === "connected" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : it.status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                  {it.status === "connected" ? "● Connected" : it.status === "error" ? "● Error" : "○ Disconnected"}
                </Badge>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500">
                Required env: <code className="font-mono">{m.env}</code>
              </div>
              {msg && msg.p === it.provider && (
                <div className={`mt-2 rounded-lg p-2 text-xs ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{msg.text}</div>
              )}
              <div className="mt-3 flex gap-2">
                <button onClick={() => test(it.provider)} disabled={testing === it.provider || it.provider === "crawler"} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {testing === it.provider ? "Testing…" : "Test Connection"}
                </button>
                {it.provider === "arena" && it.status === "connected" && (
                  <button onClick={importArena} disabled={testing === "arena"} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                    {testing === "arena" ? "Importing…" : "Import AI Leads"}
                  </button>
                )}
                {!it.envConfigured && it.provider !== "crawler" && <span className="self-center text-xs text-amber-600">⚠️ Integration Required</span>}
              </div>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="mt-6 text-lg font-bold">More Integrations</h2>
        <p className="text-sm text-slate-500">These providers power the additional requested workflows. Add the listed credentials to connect — nothing is simulated.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXTERNAL_CATALOG.map((c) => (
            <Card key={c.name} className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg font-bold">{c.icon}</div>
                <div className="min-w-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="truncate text-xs text-slate-500">{c.desc}</div>
                </div>
              </div>
              <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500">Required: <code className="font-mono">{c.env}</code></div>
              <div className="mt-2 text-xs font-medium text-amber-600">⚠️ Integration Required</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
