"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, CATEGORY_STYLE, cx } from "@/lib/ui";
import { serviceName } from "@/lib/services";

interface Lead { id: number; company: string; contactName: string | null; email: string | null; industry: string | null; location: string | null; leadScore: number; scoreCategory: string; websiteScore: number | null; recommendedServices: string[] | null; }

const AGENTS = [
  { key: "lead", name: "Lead Agent", icon: "🎯", desc: "Analyzes lead data and highlights top prospects for conversion.", works: true },
  { key: "sales", name: "Sales Agent", icon: "💼", desc: "Sales pitch, objection handling, suggested answers.", works: false },
  { key: "interpreter", name: "Interpreter Agent", icon: "🎙️", desc: "Real-time two-way voice translation (NOVA AI).", works: true, link: "/meet" },
  { key: "negotiation", name: "Negotiation Agent", icon: "🤝", desc: "Private negotiation support & counter-offer suggestions.", works: false },
  { key: "followup", name: "Follow-up Agent", icon: "⏰", desc: "Detects when follow-up is needed & drafts the message.", works: true },
  { key: "document", name: "Document Agent", icon: "📄", desc: "Document analysis, contract & quotation analysis.", works: false },
  { key: "scheduling", name: "Scheduling Agent", icon: "📅", desc: "Meeting coordination & timezone assistance.", works: false },
  { key: "support", name: "Support Agent", icon: "🎧", desc: "Multilingual customer communication assistance.", works: false },
];

export default function AgentsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    fetch("/api/leads?pageSize=50" + (filter ? `&category=${filter}` : "")).then((r) => r.json()).then((d) => setLeads(d.leads || []));
  }, [filter]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">🤖 AI Agent Ecosystem</h1>
        <p className="text-sm text-slate-500">Specialized agents that operate within granted permissions. Active agents run on your real data.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map((a) => (
          <div key={a.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-2xl">{a.icon}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-semibold">{a.name}</span>
              <Badge className={a.works ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-400"}>
                {a.works ? "● Active" : "● Coming"}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-slate-500">{a.desc}</div>
            {a.works && a.link && <Link href={a.link} className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline">Open →</Link>}
          </div>
        ))}
      </div>

      {/* Lead Agent (active) */}
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h2 className="font-semibold">Lead Agent — Top Prospects</h2>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">Ranks your leads by conversion likelihood and highlights the ones to contact first.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["", "priority", "hot", "warm", "cold"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx("rounded-lg px-3 py-1.5 text-sm", filter === f ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white")}>{f || "All"}</button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {leads.slice(0, 12).map((l) => (
            <Link key={l.id} href={`/leads/${l.id}`} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
              <div className="flex items-center justify-between">
                <span className="font-medium text-indigo-700">{l.company}</span>
                <Badge className={CATEGORY_STYLE[l.scoreCategory]}>{l.leadScore} · {l.scoreCategory}</Badge>
              </div>
              <div className="mt-1 text-xs text-slate-500">{l.contactName || "—"} · {l.industry || "—"} · {l.location || "—"}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(l.recommendedServices || []).slice(0, 3).map((s) => <Badge key={s} className="border-indigo-200 bg-indigo-50 text-indigo-700">{serviceName(s)}</Badge>)}
              </div>
            </Link>
          ))}
          {leads.length === 0 && <div className="col-span-2 text-sm text-slate-400">No leads in this filter. Import or audit leads first.</div>}
        </div>
      </Card>
    </div>
  );
}
