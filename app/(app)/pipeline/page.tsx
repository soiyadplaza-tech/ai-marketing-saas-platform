"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, CATEGORY_STYLE, STAGE_LABELS, cx } from "@/lib/ui";
import { STAGES } from "@/lib/stages";
import SheetSelect from "@/components/SheetSelect";

interface Lead { id: number; company: string; leadScore: number; scoreCategory: string; dealValue: number; industry: string | null; stage: string; }

export default function PipelinePage() {
  const [grouped, setGrouped] = useState<Record<string, Lead[]>>({});
  const [drag, setDrag] = useState<number | null>(null);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [mobileLead, setMobileLead] = useState<Lead | null>(null);

  async function load() {
    const r = await fetch("/api/pipeline");
    const d = await r.json();
    setGrouped(d.grouped || {});
  }
  useEffect(() => { load(); }, []);

  // (5) Optimistic Kanban update with rollback on failure.
  async function move(leadId: number, stage: string) {
    let snapshot: Record<string, Lead[]> | null = null;
    setGrouped((prev) => {
      snapshot = prev;
      const next: Record<string, Lead[]> = {};
      let moved: Lead | null = null;
      for (const s of STAGES) {
        next[s] = (prev[s] || []).filter((l) => { if (l.id === leadId) { moved = { ...l, stage }; return false; } return true; });
      }
      if (moved) next[stage] = [moved, ...(next[stage] || [])];
      return next;
    });
    setPending((p) => new Set(p).add(leadId));
    try {
      const r = await fetch(`/api/leads/${leadId}`, { method: "PATCH", body: JSON.stringify({ stage }) });
      if (!r.ok) throw new Error("failed");
    } catch {
      // Roll back to the last known good state.
      if (snapshot) setGrouped(snapshot);
    } finally {
      setPending((p) => { const n = new Set(p); n.delete(leadId); return n; });
    }
  }

  const totalValue = STAGES.filter((s) => s === "won").reduce((sum, s) => sum + (grouped[s] || []).reduce((a, l) => a + (l.dealValue || 0), 0), 0);

  return (
    <div className="space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-sm text-slate-500">Drag leads across stages · Won: ৳{totalValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = grouped[stage] || [];
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag != null) { move(drag, stage); setDrag(null); } }}
              className="w-72 shrink-0"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{STAGE_LABELS[stage]}</span>
                <Badge className="border-slate-200 bg-slate-100 text-slate-600">{items.length}</Badge>
              </div>
              <div className="min-h-24 space-y-2 rounded-xl bg-slate-100 p-2">
                {items.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDrag(l.id)}
                    onClick={() => setMobileLead(l)}
                    className={cx("cursor-move", pending.has(l.id) && "opacity-60")}
                  >
                    <Card className={cx("p-3 hover:shadow-md transition", pending.has(l.id) && "ring-2 ring-indigo-300")}>
                      <Link href={`/leads/${l.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-indigo-700 hover:underline">
                        {l.company}
                        {pending.has(l.id) && <span className="ml-1 text-xs text-indigo-400">…</span>}
                      </Link>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-slate-500">{l.industry || "—"}</span>
                        <Badge className={CATEGORY_STYLE[l.scoreCategory]}>{l.leadScore}</Badge>
                      </div>
                      {l.dealValue > 0 && <div className="mt-1 text-xs font-medium text-emerald-600">৳{l.dealValue.toLocaleString()}</div>}
                    </Card>
                  </div>
                ))}
                {items.length === 0 && <div className="py-6 text-center text-xs text-slate-400">Drop here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* (4) Mobile: tap a card → native-like bottom sheet to change stage. */}
      {mobileLead && (
        <div className="fixed inset-0 z-[80] flex items-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 animate-fadein" onClick={() => setMobileLead(null)} />
          <div className="safe-bottom relative w-full rounded-t-2xl bg-white shadow-2xl animate-fadein">
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300" />
            <div className="px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">{mobileLead.company}</div>
              <div className="text-xs text-slate-500">Move to stage</div>
              <div className="mt-3">
                <SheetSelect
                  options={STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
                  value={mobileLead.stage}
                  onChange={(v) => {
                    if (v && v !== mobileLead.stage) {
                      move(mobileLead.id, v);
                      setMobileLead(null);
                    }
                  }}
                />
              </div>
              <button onClick={() => setMobileLead(null)} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
