"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

const STATUS = {
  Operational: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Degraded: "border-amber-200 bg-amber-50 text-amber-700",
  Down: "border-rose-200 bg-rose-50 text-rose-700",
  Unknown: "border-slate-200 bg-slate-50 text-slate-600",
  "Not Configured": "border-slate-200 bg-slate-50 text-slate-500",
};

export default function MonitoringPage() {
  const [data, setData] = useState<any>(null);
  const [auto, setAuto] = useState(true);

  async function load() {
    const r = await fetch("/api/monitoring/status");
    setData(await r.json());
  }

  useEffect(() => {
    load();
    if (!auto) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [auto]);

  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  const s = data.stats || {};
  const h = data.health || {};

  return (
    <div className="mx-auto max-w-7xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Live Monitoring</h1>
          <p className="text-sm text-slate-500">Real database-driven monitoring. Refreshes every 15 seconds when auto-refresh is enabled.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAuto((v) => !v)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{auto ? "Auto-refresh ON" : "Auto-refresh OFF"}</button>
          <button onClick={load} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Online users" value={s.onlineUsers} />
        <Metric label="Active sessions" value={s.activeSessions} />
        <Metric label="Logins 24h" value={s.logins24h} />
        <Metric label="Failed logins" value={s.failedLogins24h} danger={s.failedLogins24h > 0} />
        <Metric label="API requests 24h" value={s.api24h} />
        <Metric label="API requests 5m" value={s.api5m} />
        <Metric label="User activity 24h" value={s.userActivity24h} />
        <Metric label="AI jobs 24h" value={s.aiActivity24h} />
        <Metric label="Meetings 24h" value={s.meetingActivity24h} />
        <Metric label="Uploads 24h" value={s.uploads24h} />
        <Metric label="Open errors" value={s.openErrors} danger={s.openErrors > 0} />
        <Metric label="Storage bytes" value={Number(s.storageBytes || 0).toLocaleString()} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">System Health</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(h).map(([k, v]: any) => (
            <div key={k} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-3">
              <div>
                <div className="text-sm font-semibold capitalize">{k.replace(/([A-Z])/g, " $1")}</div>
                {v.detail && <div className="text-xs text-slate-400">{v.detail}</div>}
                {v.provider && <div className="text-xs text-slate-400">Provider: {v.provider}</div>}
                {typeof v.latencyMs === "number" && <div className="text-xs text-slate-400">Latency: {v.latencyMs}ms</div>}
              </div>
              <Badge className={STATUS[v.status as keyof typeof STATUS] || STATUS.Unknown}>{v.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Recent title="Recent API requests" rows={data.recent.api} fields={["method", "path", "userId", "createdAt"]} />
        <Recent title="Security events" rows={data.recent.security} fields={["eventType", "actorName", "status", "createdAt"]} />
        <Recent title="Background jobs" rows={data.recent.jobs} fields={["type", "label", "status", "createdAt"]} />
        <Recent title="Open/errors" rows={data.recent.errors} fields={["service", "severity", "message", "createdAt"]} />
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: any; danger?: boolean }) {
  return <Card className={`p-4 ${danger ? "border-rose-200 bg-rose-50" : ""}`}><div className="text-2xl font-bold">{value ?? 0}</div><div className="text-xs text-slate-500">{label}</div></Card>;
}

function Recent({ title, rows, fields }: { title: string; rows: any[]; fields: string[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-3 font-semibold">{title}</div>
      <div className="max-h-72 overflow-auto">
        {(!rows || rows.length === 0) && <div className="p-6 text-center text-sm text-slate-400">No data available</div>}
        {rows?.map((r) => (
          <div key={r.id} className="grid grid-cols-4 gap-2 border-b border-slate-50 p-2 text-xs">
            {fields.map((f) => (
              <div key={f} className="truncate" title={String(r[f] ?? "")}>{f === "createdAt" ? (r[f] ? new Date(r[f]).toLocaleTimeString() : "—") : String(r[f] ?? "—")}</div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
