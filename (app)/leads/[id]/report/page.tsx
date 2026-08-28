"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, SEVERITY_STYLE, ScoreRing } from "@/lib/ui";
import { COMPANY, serviceName } from "@/lib/services";

export default function LeadReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [r, setR] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/reports?type=lead_audit&leadId=${id}`).then((x) => x.json()).then((d) => setR(d.report));
  }, [id]);

  if (!r) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/leads/${id}`} className="text-sm text-indigo-600 hover:underline">← Back to lead</Link>
        <button onClick={() => window.print()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Print / Save PDF</button>
      </div>

      <Card className="p-8">
        {/* Letterhead */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">F</div>
            <div>
              <div className="text-lg font-bold">{COMPANY.name}</div>
              <div className="text-xs text-slate-500">{COMPANY.tagline}</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>{COMPANY.email}</div>
            <div>WhatsApp: {COMPANY.whatsapp}</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{r.title}</h1>
        {r.lead && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1 text-sm">
              <div><b>Company:</b> {r.lead.company}</div>
              <div><b>Contact:</b> {r.lead.contact || "—"}</div>
              <div><b>Website:</b> {r.lead.website || "—"}</div>
              <div><b>Industry:</b> {r.lead.industry || "—"}</div>
              <div><b>Location:</b> {r.lead.location || "—"}</div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-4">
              <ScoreRing score={r.lead.leadScore || 0} size={72} />
              <Badge className="mt-2 border-indigo-200 bg-indigo-50 text-indigo-700">{(r.lead.category || "").toUpperCase()} LEAD</Badge>
            </div>
          </div>
        )}

        {r.scores && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold">Website Audit Scores</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
              {Object.entries(r.scores).map(([k, v]: any) => (
                <div key={k} className="rounded-lg border border-slate-200 p-2 text-center">
                  <div className="text-lg font-bold">{v ?? "—"}</div>
                  <div className="text-[10px] capitalize text-slate-500">{k}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.opportunities?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold">Detected Opportunities & Recommendations</h2>
            <div className="space-y-2">
              {r.opportunities.map((o: any, k: number) => (
                <div key={k} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="flex items-center justify-between"><b>{o.problem}</b><Badge className={SEVERITY_STYLE[o.severity]}>{o.severity}</Badge></div>
                  <div className="mt-1 text-slate-600">Impact: {o.businessImpact}</div>
                  <div className="text-slate-600">Recommended service: <b className="text-indigo-700">{o.service}</b> · {o.confidence}% confidence</div>
                  <div className="text-slate-500">Action: {o.action}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {r.serviceMatrix && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold">A→Z Service Audit Matrix</h2>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-2">Service</th><th className="p-2">Status</th><th className="p-2">Evidence</th></tr></thead>
                <tbody>
                  {r.serviceMatrix.map((m: any) => (
                    <tr key={m.service} className="border-t border-slate-100">
                      <td className="p-2 font-medium">{serviceName(m.service)}</td>
                      <td className="p-2">
                        <Badge className={m.status === "strong" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : m.status === "gap" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                          {m.status === "strong" ? "✓ Covered" : m.status === "gap" ? "⚠ Gap" : "— Check needed"}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs text-slate-500">{m.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {r.findings?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold">Full Audit Findings</h2>
            <div className="space-y-1">
              {r.findings.map((f: any, k: number) => (
                <div key={k} className="flex items-start gap-2 text-sm">
                  <span>{f.passed ? "✅" : f.severity === "critical" ? "🔴" : f.severity === "warning" ? "🟡" : "🔵"}</span>
                  <span><b>{f.title}</b> — {f.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Prepared by {COMPANY.name} · {COMPANY.website}
        </div>
      </Card>
    </div>
  );
}
