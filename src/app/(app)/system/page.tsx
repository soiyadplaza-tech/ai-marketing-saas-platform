"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

export default function SystemPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/system/status");
    setData(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  if (loading) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Check</h1>
          <p className="text-sm text-slate-500">Live health for database, sheet data, email sending, integrations and background jobs.</p>
        </div>
        <button onClick={load} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Status title="Application" ok={data.ok} detail={`${data.latencyMs}ms`} />
        <Status title="Database" ok={data.database?.ok} detail="Schema ready" />
        <Status title="Sheet Data" ok={data.leads?.total > 0} detail={`${data.leads?.total?.toLocaleString()} profiles`} />
        <Status title="Email Provider" ok={data.outreach?.provider !== "none"} detail={data.outreach?.provider} />
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Lead Data Sources</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.leads?.sources || {}).map(([k, v]: any) => (
            <Badge key={k} className="border-indigo-200 bg-indigo-50 text-indigo-700">{k}: {Number(v).toLocaleString()}</Badge>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Email Quota</h2>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Metric label="Sent Today" value={data.outreach.quota.sentToday} />
          <Metric label="Remaining" value={data.outreach.quota.remainingToday} />
          <Metric label="Min Target" value={data.outreach.quota.minTarget} />
          <Metric label="Max Cap" value={data.outreach.quota.maxLimit} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Integrations</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Status title="Google Sheet URL" ok={data.integrations.sheetUrlConfigured} detail="master source" />
          <Status title="Base44" ok={data.integrations.base44?.ok} detail={data.integrations.base44?.name || data.integrations.base44?.error} />
          <Status title="Resend" ok={data.integrations.resend} detail="email API" />
          <Status title="SMTP" ok={data.integrations.smtp} detail="optional" />
          <Status title="SendGrid" ok={data.integrations.sendgrid} detail="optional" />
        </div>
      </Card>
    </div>
  );
}

function Status({ title, ok, detail }: { title: string; ok: boolean; detail?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{title}</div>
          {detail && <div className="text-xs text-slate-500">{detail}</div>}
        </div>
        <Badge className={ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}>{ok ? "OK" : "Needs setup"}</Badge>
      </div>
    </Card>
  );
}
function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-bold">{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}
