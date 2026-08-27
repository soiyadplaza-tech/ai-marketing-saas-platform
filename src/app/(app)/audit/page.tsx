"use client";

import { useState } from "react";
import { Card, Badge, SEVERITY_STYLE, ScoreRing } from "@/lib/ui";
import { serviceName } from "@/lib/services";

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [opps, setOpps] = useState<any[]>([]);

  async function run() {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null); setOpps([]);
    try {
      const r = await fetch("/api/audit", { method: "POST", body: JSON.stringify({ url }) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Audit failed"); }
      else { setResult(d.audit); setOpps(d.opportunities || []); }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Website Auditor</h1>
        <p className="text-sm text-slate-500">Real AI-powered analysis — we fetch and inspect the live website (no fake results).</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="example.com"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
          />
          <button onClick={run} disabled={loading} className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
            {loading ? "Analyzing…" : "Audit Website"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">We respect robots restrictions and never bypass security or authentication.</p>
      </Card>

      {loading && (
        <Card className="p-10 text-center">
          <span className="spinner spinner-dark mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Fetching and analyzing the website…</p>
        </Card>
      )}

      {error && (
        <Card className="border-rose-200 bg-rose-50 p-4">
          <p className="font-medium text-rose-700">⚠️ {error}</p>
          <button onClick={run} className="mt-2 rounded-lg border border-rose-300 px-3 py-1 text-sm text-rose-700">Retry</button>
        </Card>
      )}

      {result && (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <ScoreRing score={result.overallScore || 0} size={72} />
              <div className="flex-1">
                <div className="font-semibold">{result.finalUrl}</div>
                <div className="text-sm text-slate-500">{result.ok ? "Analysis complete" : "Could not fully analyze"}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[["Technical", result.scores.technical], ["On-Page", result.scores.onpage], ["Performance", result.scores.performance], ["Conversion", result.scores.conversion], ["Local", result.scores.local], ["Social", result.scores.social]].map(([l, v]: any) => (
                <div key={l} className="rounded-lg border border-slate-200 p-2 text-center">
                  <div className="text-lg font-bold">{v}</div>
                  <div className="text-[10px] text-slate-500">{l}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Tracking */}
          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Tracking & Pixels Detected</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.tracking).map(([k, v]) => (
                <Badge key={k} className={v ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                  {v ? "✓" : "✗"} {label(k)}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Opportunities */}
          {opps.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 font-semibold">💡 Detected Opportunities ({opps.length})</h3>
              <div className="space-y-2">
                {opps.map((o, i) => (
                  <div key={i} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{o.problem}</span>
                      <Badge className={SEVERITY_STYLE[o.severity]}>{o.severity}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">→ {serviceName(o.recommendedService)} · {o.confidence}% confidence</div>
                    <div className="text-xs text-slate-500">{o.recommendedAction}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Findings */}
          <Card className="p-4">
            <h3 className="mb-2 font-semibold">All Findings ({result.findings.length})</h3>
            <div className="space-y-1.5">
              {result.findings.map((f: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span>{f.passed ? "✅" : f.severity === "critical" ? "🔴" : f.severity === "warning" ? "🟡" : "🔵"}</span>
                  <div>
                    <span className="font-medium">{f.title}</span>
                    <span className="text-slate-500"> — {f.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function label(k: string): string {
  const map: Record<string, string> = {
    googleAnalytics: "Google Analytics", gtm: "Tag Manager", metaPixel: "Meta Pixel",
    googleAds: "Google Ads", tiktokPixel: "TikTok Pixel", linkedinInsight: "LinkedIn Insight",
  };
  return map[k] || k;
}
