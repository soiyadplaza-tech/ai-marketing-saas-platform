"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Badge, SEVERITY_STYLE } from "@/lib/ui";

const TYPES = [
  { key: "audit_summary", label: "Audit Summary", icon: "🔍", desc: "Aggregated website audit scores & top issues." },
  { key: "weekly_notes", label: "Weekly Team Notes", icon: "🗒️", desc: "Meeting notes with metrics, agenda & highlights." },
  { key: "monthly_status", label: "Monthly Status", icon: "📅", desc: "Monthly lead & audit status report." },
];

export default function ReportsPage() {
  const [type, setType] = useState("audit_summary");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/reports?type=${type}`);
    const d = await r.json();
    setData(d);
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load]);

  function download(fmt: "json" | "csv") {
    if (!data) return;
    let content = ""; let mime = "application/json"; let ext = "json";
    if (fmt === "json") content = JSON.stringify(data.report, null, 2);
    else {
      mime = "text/csv"; ext = "csv";
      content = toCsv(data.report);
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${type}-report.${ext}`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Reports Center</h1>
          <p className="text-sm text-slate-500">Professional reports generated from your real analysis data.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={() => download("csv")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Export CSV</button>
          <button onClick={() => download("json")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Export JSON</button>
          <button onClick={() => window.print()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Print / PDF</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => setType(t.key)} className={`rounded-xl border p-4 text-left transition ${type === t.key ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="text-2xl">{t.icon}</div>
            <div className="mt-2 font-semibold">{t.label}</div>
            <div className="text-xs text-slate-500">{t.desc}</div>
          </button>
        ))}
      </div>

      {loading && <Card className="p-10 text-center"><span className="spinner spinner-dark mx-auto" /></Card>}

      {!loading && data?.report && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold">{data.report.title}</h2>
              <div className="text-xs text-slate-500">Generated {new Date(data.generatedAt).toLocaleString()} · FOYSAL IT</div>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-600 font-bold text-white">F</div>
          </div>

          {type === "audit_summary" && <AuditSummary r={data.report} />}
          {type === "weekly_notes" && <WeeklyNotes r={data.report} />}
          {type === "monthly_status" && <MonthlyStatus r={data.report} />}
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function AuditSummary({ r }: { r: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Sites Audited" value={r.audited} />
        <Metric label="Avg Overall" value={r.averages.overall} />
        <Metric label="Avg On-Page" value={r.averages.onpage} />
        <Metric label="Avg Technical" value={r.averages.technical} />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Most Common Issues</h3>
        {r.topIssues.length === 0 ? <p className="text-sm text-slate-400">No issues — run some audits first.</p> : (
          <div className="space-y-1">
            {r.topIssues.map((i: any, k: number) => (
              <div key={k} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-sm">
                <span>{i.issue}</span>
                <div className="flex items-center gap-2">
                  <Badge className={SEVERITY_STYLE[i.severity] || ""}>{i.severity}</Badge>
                  <span className="text-slate-500">{i.count} sites</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {r.sites.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">Audited Sites</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-2">URL</th><th className="p-2">Score</th><th className="p-2">Date</th></tr></thead>
              <tbody>
                {r.sites.map((s: any, k: number) => (
                  <tr key={k} className="border-t border-slate-100"><td className="p-2">{s.url}</td><td className="p-2 font-medium">{s.score}</td><td className="p-2 text-slate-500">{new Date(s.date).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklyNotes({ r }: { r: any }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">Period: {r.period}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="New Leads" value={r.metrics.newLeads} />
        <Metric label="Audited" value={r.metrics.sitesAudited} />
        <Metric label="Drafts" value={r.metrics.messagesCreated} />
        <Metric label="Emails Sent" value={r.metrics.emailsSent} />
        <Metric label="Open Tasks" value={r.metrics.openTasks} />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Agenda</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">{r.agenda.map((a: string, k: number) => <li key={k}>{a}</li>)}</ol>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">This Week's Highlights</h3>
        {r.highlights.length === 0 ? <p className="text-sm text-slate-400">No activity recorded this week.</p> : (
          <ul className="space-y-1 text-sm text-slate-700">{r.highlights.map((h: string, k: number) => <li key={k} className="flex gap-2"><span className="text-indigo-500">•</span>{h}</li>)}</ul>
        )}
      </div>
    </div>
  );
}

function MonthlyStatus({ r }: { r: any }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500">Period: {r.period}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Total Leads" value={r.totals.totalLeads} />
        <Metric label="New This Month" value={r.totals.newThisMonth} />
        <Metric label="Audits Run" value={r.totals.auditsRun} />
        <Metric label="Opportunities" value={r.totals.opportunities} />
        <Metric label="Deals Won" value={r.totals.dealsWon} />
        <Metric label="Revenue Won" value={"৳" + (r.totals.revenueWon || 0).toLocaleString()} />
      </div>
    </div>
  );
}

function toCsv(report: any): string {
  const lines: string[] = [];
  const walk = (obj: any, prefix = "") => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, key);
      else if (Array.isArray(v)) lines.push(`"${key}","${JSON.stringify(v).replace(/"/g, "'")}"`);
      else lines.push(`"${key}","${String(v).replace(/"/g, "'")}"`);
    }
  };
  walk(report);
  return "Field,Value\n" + lines.join("\n");
}
