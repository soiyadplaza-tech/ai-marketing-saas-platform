"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, CATEGORY_STYLE, STAGE_LABELS, ScoreRing } from "@/lib/ui";

// (6) Lazy-load the heavy lower dashboard sections for faster first paint.
const DashboardHeavy = lazy(() => import("./DashboardHeavy"));

interface Dash {
  totalLeads: number;
  categories: Record<string, number>;
  stages: Record<string, number>;
  audited: number;
  opportunities: number;
  wonRevenue: number;
  overdueFollowUps: number;
  avgAuditScore: number;
  messages: { sent: number; drafts: number; replied: number };
  priorityLeads: Array<Record<string, unknown>>;
  recentActivity: Array<{ id: number; type: string; message: string; createdAt: string }>;
  topOpportunities: Array<{ id: number; problem: string; recommendedService: string; confidence: number; severity: string; leadId: number }>;
}

export default function DashboardPage() {
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setD).catch(() => {});
  }, []);

  if (!d) return <Loading />;

  const kpis = [
    { label: "Total Leads", value: d.totalLeads, icon: "👥", href: "/leads" },
    { label: "Priority Leads", value: d.categories.priority || 0, icon: "🔥", href: "/leads?category=priority" },
    { label: "Sites Audited", value: d.audited, icon: "🔍", href: "/audit" },
    { label: "Opportunities", value: d.opportunities, icon: "💡", href: "/leads" },
    { label: "Overdue Follow-ups", value: d.overdueFollowUps, icon: "⏰", href: "/leads" },
    { label: "Won Revenue", value: "৳" + (d.wonRevenue || 0).toLocaleString(), icon: "💰", href: "/pipeline" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Your actionable AI lead intelligence overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/import" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">+ Add Data</Link>
          <Link href="/command" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">🤖 Ask AI</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Card className="p-4 transition hover:shadow-md">
              <div className="text-2xl">{k.icon}</div>
              <div className="mt-2 text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-slate-500">{k.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Priority leads */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="font-semibold">🔥 Priority Leads</h2>
            <Link href="/leads" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {d.priorityLeads.length === 0 && <Empty text="No leads yet. Import data to get started." />}
            {d.priorityLeads.map((l) => (
              <Link key={l.id as number} href={`/leads/${l.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <ScoreRing score={(l.leadScore as number) || 0} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{l.company as string}</div>
                  <div className="truncate text-xs text-slate-500">{(l.industry as string) || "—"} · {(l.location as string) || "—"}</div>
                </div>
                <Badge className={CATEGORY_STYLE[(l.scoreCategory as string) || "cold"]}>{(l.scoreCategory as string) || "cold"}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        {/* Pipeline snapshot */}
        <Card>
          <div className="border-b border-slate-100 p-4"><h2 className="font-semibold">🎯 Pipeline</h2></div>
          <div className="space-y-2 p-4">
            {Object.entries(STAGE_LABELS).map(([k, label]) => {
              const n = d.stages[k] || 0;
              const pct = d.totalLeads ? Math.round((n / d.totalLeads) * 100) : 0;
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-medium">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* (6) Heavy sections lazy-loaded — KPIs + priority leads paint first. */}
      <Suspense fallback={<div className="grid min-h-[20vh] place-items-center"><div className="spinner spinner-dark" /></div>}>
        <DashboardHeavy d={d} />
      </Suspense>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="spinner spinner-dark" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-slate-400">{text}</div>;
}
