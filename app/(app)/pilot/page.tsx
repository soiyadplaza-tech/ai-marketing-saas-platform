"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/lib/ui";

export default function PilotPage() {
  const [st, setSt] = useState<any>(null);
  const [domain, setDomain] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  const [busyAuto, setBusyAuto] = useState(false);
  const [autoMsg, setAutoMsg] = useState("");

  async function autoWork() {
    setBusyAuto(true); setAutoMsg("");
    const r = await fetch("/api/automations/auto-work", { method: "POST", body: JSON.stringify({ limit: 25 }) });
    const d = await r.json();
    setBusyAuto(false);
    setAutoMsg(d.message || JSON.stringify(d));
  }

  async function load() {
    const [a, d] = await Promise.all([
      fetch("/api/automations/daily").then((r) => r.json()),
      fetch("/api/domain/status").then((r) => r.json()),
    ]);
    setSt(a);
    setDomain(d);
  }
  useEffect(() => { load(); }, []);

  async function run(force = false) {
    setBusy(true); setLog("Running AI Pilot…");
    const r = await fetch(force ? "/api/cron/autopilot?force=1" : "/api/automations/daily", {
      method: "POST",
      body: JSON.stringify(force ? {} : { action: "run", force: true }),
    });
    const d = await r.json();
    setBusy(false);
    setLog(d.message || JSON.stringify(d));
    load();
  }

  async function toggle() {
    await fetch("/api/automations/daily", { method: "POST", body: JSON.stringify({ action: "config", enabled: !st?.enabled }) });
    load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#2a0a3a] via-[#4a0d67] to-[#6d28d9] p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200">FOYSAL IT · Autopilot</div>
            <h1 className="mt-2 text-3xl font-extrabold">AI Pilot</h1>
            <p className="mt-2 max-w-xl text-sm text-fuchsia-100/80">
              One command runs the full loop: audit websites → score leads → match a FOYSAL IT service → write human email → auto-approve a small batch → send via Resend.
            </p>
          </div>
          <img src="/images/logo.png" alt="" className="h-16 w-16 rounded-2xl ring-1 ring-white/20" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={toggle} className={`rounded-xl px-4 py-2 text-sm font-bold ${st?.enabled ? "bg-emerald-400 text-emerald-950" : "bg-white/15"}`}>
            {st?.enabled ? "Pilot ON" : "Pilot OFF"}
          </button>
          <button onClick={() => run(false)} disabled={busy} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-purple-800 disabled:opacity-50">Run daily batch</button>
          <button onClick={() => run(true)} disabled={busy} className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold disabled:opacity-50">Force full autopilot</button>
          <button onClick={autoWork} disabled={busy || busyAuto} className="rounded-xl bg-fuchsia-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busyAuto ? "Working…" : "⚡ AI Auto Work"}</button>
          <Link href="/automations" className="rounded-xl border border-white/20 px-4 py-2 text-sm">Cron setup →</Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Sent today" value={st?.quota?.sentToday ?? "—"} />
        <Metric label="Remaining" value={st?.quota?.remainingToday ?? "—"} />
        <Metric label="Daily target" value={st?.target ?? 500} />
        <Metric label="Mail robot" value={domain?.mailRobot?.primary || "…"} ok={domain?.mailRobot?.ready} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">What the Pilot does (nothing is faked)</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li>1. Picks unaudited leads that have a website.</li>
          <li>2. Fetches the live page and scores technical / SEO / local / tracking.</li>
          <li>3. Matches a real FOYSAL IT service (SEO, Local SEO, Meta Pixel, GTM…).</li>
          <li>4. Writes a personalized email from that evidence.</li>
          <li>5. Auto-approves only a small batch, then sends via Gmail (foysalahmed.dm23@gmail.com) with automatic backup to Resend/SendGrid if Gmail fails.</li>
          <li>6. Stops at daily cap (400–1500) and skips unsubscribed addresses.</li>
        </ol>
        {log && <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{log}</div>}
        {domain?.mailRobot?.ready ? (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            🟢 Mail robot ready via <b>{domain.mailRobot.primary}</b>. {domain.mailRobot.note}
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            🟡 No mail provider ready yet. {domain?.mailRobot?.note || "Add a Gmail app password (Domain → Email Robot) or a Resend key."} <Link href="/domain" className="font-semibold underline">Open Domain setup</Link>
          </div>
        )}
        {domain && !domain.resend?.verified && (
          <div className="mt-2 text-xs text-slate-400">
            Note: Resend (backup sender) will send from <code>foysalahmed.dm23@gmail.com</code> until foysalit.com DNS is verified on Resend — that is optional, Gmail is the primary.
          </div>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/services" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-indigo-300">Public Services page →</Link>
        <Link href="/outreach" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-indigo-300">Review messages →</Link>
        <Link href="/command" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-indigo-300">AI Command Center →</Link>
      </div>
    </div>
  );
}

function Metric({ label, value, ok }: { label: string; value: any; ok?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold">{String(value)}</div>
      {ok != null && <Badge className={ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{ok ? "ready" : "setup"}</Badge>}
    </Card>
  );
}
