"use client";

import Link from "next/link";
import { Card, Badge, SEVERITY_STYLE, CATEGORY_STYLE, timeAgo, cx } from "@/lib/ui";
import { serviceName } from "@/lib/services";

// (6) Heavy dashboard sections, lazy-loaded with React.lazy() so the KPIs +
// priority leads paint instantly on mobile webviews.
export default function DashboardHeavy({ d }: { d: any }) {
  const Empty = ({ text }: { text: string }) => (
    <div className="p-8 text-center text-sm text-slate-400">{text}</div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="border-b border-slate-100 p-4"><h2 className="font-semibold">💡 Top AI Opportunities</h2></div>
          <div className="divide-y divide-slate-100">
            {d.topOpportunities.length === 0 && <Empty text="Run website audits to detect opportunities." />}
            {d.topOpportunities.map((o: any) => (
              <Link key={o.id} href={`/leads/${o.leadId}`} className="block p-4 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{o.problem}</span>
                  <Badge className={SEVERITY_STYLE[o.severity]}>{o.severity}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>→ {serviceName(o.recommendedService)}</span>
                  <span>·</span>
                  <span>{o.confidence}% confidence</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-100 p-4"><h2 className="font-semibold">🕒 Recent Activity</h2></div>
          <div className="divide-y divide-slate-100">
            {d.recentActivity.length === 0 && <Empty text="No activity yet." />}
            {d.recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-slate-700">{a.message}</span>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Lead Temperature</h2>
        <div className="grid grid-cols-4 gap-3">
          {["priority", "hot", "warm", "cold"].map((c) => (
            <div key={c} className={cx("rounded-lg border p-3 text-center", CATEGORY_STYLE[c])}>
              <div className="text-2xl font-bold">{d.categories[c] || 0}</div>
              <div className="text-xs capitalize">{c}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
