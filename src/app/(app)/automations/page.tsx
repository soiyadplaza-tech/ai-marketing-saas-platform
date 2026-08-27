"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/lib/ui";
import { WORKFLOWS } from "@/lib/workflows";

interface Auto { id: number; name: string; trigger: string; enabled: boolean; runCount: number; steps: { type: string; label: string }[]; }

export default function AutomationsPage() {
  const [autos, setAutos] = useState<Auto[]>([]);

  useEffect(() => {
    fetch("/api/automations").then((r) => r.json()).then((d) => setAutos(d.automations || []));
  }, []);

  async function toggle(id: number, enabled: boolean) {
    await fetch("/api/automations", { method: "PATCH", body: JSON.stringify({ id, enabled: !enabled }) });
    setAutos((a) => a.map((x) => (x.id === id ? { ...x, enabled: !enabled } : x)));
  }

  const stepColor: Record<string, string> = {
    trigger: "border-indigo-200 bg-indigo-50 text-indigo-700",
    action: "border-sky-200 bg-sky-50 text-sky-700",
    approval: "border-amber-200 bg-amber-50 text-amber-700",
    wait: "border-slate-200 bg-slate-50 text-slate-600",
    condition: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Automation Engine</h1>
        <p className="text-sm text-slate-500">Visual trigger → condition → action workflows. External sends always pause for approval.</p>
      </div>

      <DailyAutoCard />

      {autos.length === 0 && <Card className="p-10 text-center text-slate-400">No automations yet.</Card>}

      {autos.map((a) => (
        <Card key={a.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{a.name}</div>
              <div className="text-xs text-slate-500">Trigger: {a.trigger} · Runs: {a.runCount}</div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={a.enabled} onChange={() => toggle(a.id, a.enabled)} className="h-4 w-8 appearance-none rounded-full bg-slate-300 transition checked:bg-indigo-600" />
              <span>{a.enabled ? "Enabled" : "Disabled"}</span>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {a.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Badge className={stepColor[s.type] || "border-slate-200 bg-slate-50"}>{s.label}</Badge>
                {i < a.steps.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Workflow library — honest catalog of requested automations */}
      <div className="pt-4">
        <h2 className="text-lg font-bold">Workflow Library</h2>
        <p className="text-sm text-slate-500">
          <span className="font-medium text-emerald-600">Active</span> workflows run today on your data.{" "}
          <span className="font-medium text-amber-600">Integration Required</span> workflows unlock once you connect the listed provider.
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {WORKFLOWS.map((g) => (
            <Card key={g.group} className="p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold"><span>{g.icon}</span>{g.group}</div>
              <div className="space-y-1.5">
                {g.items.map((it) => (
                  <div key={it.name} className="flex items-center justify-between gap-2 text-sm">
                    {it.href && it.status === "active" ? (
                      <Link href={it.href} className="text-slate-700 hover:text-indigo-600 hover:underline">{it.name}</Link>
                    ) : (
                      <span className="text-slate-700">{it.name}</span>
                    )}
                    {it.status === "active" ? (
                      <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge className="shrink-0 border-amber-200 bg-amber-50 text-amber-700" >{it.needs}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyAutoCard() {
  const [st, setSt] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    const r = await fetch("/api/automations/daily");
    setSt(await r.json());
  }
  useEffect(() => {
    load();
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const cronUrl = `${origin}/api/cron/autopilot`;
  async function copyCron() {
    try { await navigator.clipboard.writeText(cronUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt("Copy your autopilot URL:", cronUrl); }
  }

  async function setEnabled(v: boolean) {
    setBusy(true);
    await fetch("/api/automations/daily", { method: "POST", body: JSON.stringify({ action: "config", enabled: v }) });
    setBusy(false);
    load();
  }
  async function setConfig(target: number, batch: number) {
    await fetch("/api/automations/daily", { method: "POST", body: JSON.stringify({ action: "config", target, batch }) });
    load();
  }
  async function run() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/automations/daily", { method: "POST", body: JSON.stringify({ action: "run", force: true }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) setMsg(d.error || "Run failed");
    else setMsg(`Generated ${d.generated} · auto-approved ${d.approved} · sent ${d.sent} (via ${d.provider}). Sent today: ${d.quota?.sentToday}.`);
    load();
  }

  const target = st?.target ?? 500;
  const batch = st?.batch ?? 50;

  return (
    <Card className="overflow-hidden border-fuchsia-200">
      <div className="bg-gradient-to-r from-[#2a0a3a] via-[#4a0d67] to-[#6d28d9] p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h2 className="text-lg font-bold">Daily AI Auto-Outreach</h2>
            </div>
            <p className="mt-1 max-w-xl text-xs text-fuchsia-100/80">
              While you are away, FOYSAL IT finds top leads, runs AI audit + service matching, writes human-like personalized emails,
              auto-approves a small batch and sends them through your provider — up to your daily target.
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold">
            <span>{st?.enabled ? "ON" : "OFF"}</span>
            <button
              onClick={() => setEnabled(!st?.enabled)}
              disabled={busy}
              className={`relative h-6 w-11 rounded-full transition ${st?.enabled ? "bg-emerald-500" : "bg-white/30"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${st?.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fuchsia-200/70">Daily target (400–1500)</label>
            <input
              type="number" min={400} max={1500} value={target}
              onChange={(e) => setConfig(Number(e.target.value), batch)}
              className="mt-0.5 w-28 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fuchsia-200/70">Batch per run</label>
            <select value={batch} onChange={(e) => setConfig(target, Number(e.target.value))} className="mt-0.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white">
              <option value={25}>25 emails</option>
              <option value={50}>50 emails</option>
              <option value={100}>100 emails</option>
              <option value={200}>200 emails</option>
            </select>
          </div>
          <button onClick={run} disabled={busy} className="ml-auto rounded-lg bg-white px-4 py-2 text-sm font-bold text-purple-700 shadow disabled:opacity-60">
            {busy ? "Working…" : "▶ Run Now"}
          </button>
        </div>

        {st?.quota && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-white/10 p-2"><div className="text-lg font-bold">{st.quota.sentToday}</div><div className="text-[10px] text-fuchsia-200/70">sent today</div></div>
            <div className="rounded-lg bg-white/10 p-2"><div className="text-lg font-bold">{st.quota.remainingToday}</div><div className="text-[10px] text-fuchsia-200/70">remaining today</div></div>
            <div className="rounded-lg bg-white/10 p-2"><div className="text-lg font-bold">{st.ranToday ? "✅" : "—"}</div><div className="text-[10px] text-fuchsia-200/70">auto-run today</div></div>
          </div>
        )}
      </div>
      <div className="space-y-2 p-4 text-xs text-slate-600">
        <div className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">1</span> AI picks your highest-score new leads (audited + opportunity-matched)</div>
        <div className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">2</span> Writes personalized, human-sounding email using the lead's real problems + matched service</div>
        <div className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">3</span> Auto-approves a small batch (the batch size above) — never the whole list at once</div>
        <div className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">4</span> Sends via your real email provider, respecting the daily target, 1500 hard cap, and opt-out list</div>
        <div className="rounded-lg bg-amber-50 p-2 text-amber-800">
          ⚠️ <b>Honest notes:</b> This sandbox is not a 24/7 server — to run truly unattended, point a free external cron at the autopilot URL below (setup in 2 minutes). Emails only send while your provider (Resend/SMTP) is connected and its domain verified.
        </div>

        {/* External cron / autopilot URL */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="flex items-center gap-2 font-semibold text-indigo-900">
            <span>⏰</span> Run automatically every day (even when you're away)
          </div>
          <p className="mt-1 text-xs text-indigo-800/80">Set this URL in any free cron service — the AI audits + emails by itself, once per day:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-indigo-200 bg-white px-3 py-2 font-mono text-xs text-indigo-700">{cronUrl || "/api/cron/autopilot"}</code>
            <button onClick={copyCron} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-white ${copied ? "bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-500"}`}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-indigo-900 sm:grid-cols-3">
            <div className="rounded-lg bg-white/70 p-2">
              <div className="font-semibold">Option A — cron-job.org (free)</div>
              <ol className="mt-1 list-decimal pl-4 text-indigo-800/80">
                <li>Create a new job</li>
                <li>Paste the URL above</li>
                <li>Schedule: every day 9:00 AM</li>
                <li>Save — done ✅</li>
              </ol>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <div className="font-semibold">Option B — Google Apps Script</div>
              <ol className="mt-1 list-decimal pl-4 text-indigo-800/80">
                <li>script.google.com → New project</li>
                <li>Paste: <code className="text-[10px]">{`UrlFetchApp.fetch("URL", { method: "get" });`}</code></li>
                <li>Triggers → daily</li>
                <li>Run — done ✅</li>
              </ol>
            </div>
            <div className="rounded-lg bg-white/70 p-2">
              <div className="font-semibold">How it's protected</div>
              <ul className="mt-1 list-disc pl-4 text-indigo-800/80">
                <li>Max 1 run / 6h (no spam)</li>
                <li>Once-per-day guard</li>
                <li>Optional <code className="text-[10px]">CRON_SECRET</code> token</li>
                <li>Respects 400–1500/day cap</li>
              </ul>
            </div>
          </div>
        </div>
        {msg && <div className="rounded-lg bg-sky-50 p-2 text-sky-700">{msg}</div>}
      </div>
    </Card>
  );
}
