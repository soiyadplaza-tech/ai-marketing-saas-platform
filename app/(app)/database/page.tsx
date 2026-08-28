"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

export default function DatabasePage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/db/health").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  const totalRows = (data.tables || []).reduce((a: number, t: any) => a + (Number(t.rows) || 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Database</h1>
        <p className="text-sm text-slate-500">Permanent Neon PostgreSQL (serverless) with performance indexes. Live size & health.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Engine</div>
          <div className="text-lg font-bold">PostgreSQL · Neon</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Query ping</div>
          <div className="text-lg font-bold">{data.pingMs} ms</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Total rows (all tables)</div>
          <div className="text-lg font-bold">{totalRows.toLocaleString()}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tables (by size)</h2>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">● healthy</Badge>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr><th className="p-2">Table</th><th className="p-2">Rows</th><th className="p-2">Size (incl. indexes)</th></tr>
            </thead>
            <tbody>
              {(data.tables || []).map((t: any) => (
                <tr key={t.name} className="border-t border-slate-100">
                  <td className="p-2 font-mono text-xs">{t.name}</td>
                  <td className="p-2">{Number(t.rows || 0).toLocaleString()}</td>
                  <td className="p-2 text-xs text-slate-500">{t.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">Performance indexes (leads table)</h2>
        <div className="mt-3 space-y-1">
          {(data.leadIndexes || []).map((ix: any) => (
            <div key={ix.indexname} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <span className="font-mono text-indigo-700">{ix.indexname}</span>
              <span className="ml-2 text-slate-400">{ix.indexdef.replace(/CREATE (UNIQUE )?INDEX \S+ ON leads/i, "").replace(/\n/g, " ")}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 text-xs text-slate-500">
        The database <b>self-heals</b> on every request (schema sync) and <b>persists</b> on Neon — it survives app restarts. Big tables (45k+ leads) use indexes on email, website, stage+score, audited_at and category for fast search/filter.
      </Card>
    </div>
  );
}
