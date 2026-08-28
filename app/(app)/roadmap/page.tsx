"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

const STATUS_STYLE: Record<string, string> = {
  live: "border-emerald-200 bg-emerald-50 text-emerald-700",
  working: "border-sky-200 bg-sky-50 text-sky-700",
  setup_required: "border-amber-200 bg-amber-50 text-amber-700",
  future: "border-slate-200 bg-slate-50 text-slate-600",
  blocked: "border-rose-200 bg-rose-50 text-rose-700",
};

const STATUS_LABEL: Record<string, string> = {
  live: "🟢 Live",
  working: "🔵 Working / optional upgrade",
  setup_required: "🟡 Setup required",
  future: "⚪ Future",
  blocked: "🔴 Blocked",
};

export default function RoadmapPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/roadmap/status").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Missing / Future / Setup Checklist</h1>
          <p className="text-sm text-slate-500">Truthful status — what is live, what needs setup, and what is future. No fake “connected”.</p>
        </div>
        <div className="flex gap-2">
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{data.summary.live} live</Badge>
          <Badge className="border-amber-200 bg-amber-50 text-amber-700">{data.summary.setupRequired} setup</Badge>
          <Badge className="border-slate-200 bg-slate-50 text-slate-600">{data.summary.future} future</Badge>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold">Domain status</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-400">Active Netlify URL</div>
            <div className="break-all font-mono text-sm font-semibold">{data.activeUrl}</div>
            <Badge className={data.active.ok ? STATUS_STYLE.live : STATUS_STYLE.blocked}>{data.active.ok ? "🟢 Live" : "🔴 Down"}</Badge>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-400">Custom domain</div>
            <div className="break-all font-mono text-sm font-semibold">https://{data.customDomain}</div>
            <Badge className={data.custom.ok ? STATUS_STYLE.live : STATUS_STYLE.setup_required}>{data.custom.ok ? "🟢 Live" : "🟡 DNS not connected"}</Badge>
          </div>
        </div>
        {!data.custom.ok && (
          <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Custom domain active korte: Netlify → Domain management → add <b>{data.customDomain}</b> → Netlify jei DNS record debe, seta DNSExit/PublicVM e boshao. Screenshot dile ami exact field bole debo.
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {data.modules.map((m: any) => (
          <Card key={m.area} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{m.area}</div>
                <div className="mt-1 text-sm text-slate-600">{m.note}</div>
                {m.next && <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-500"><b>Next:</b> {m.next}</div>}
              </div>
              <Badge className={STATUS_STYLE[m.status] || STATUS_STYLE.future}>{STATUS_LABEL[m.status] || m.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
