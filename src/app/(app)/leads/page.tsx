"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, Badge, CATEGORY_STYLE, STAGE_LABELS } from "@/lib/ui";
import { SERVICE_LIST, serviceName } from "@/lib/services";
import SheetSelect from "@/components/SheetSelect";

const STAGE_OPTIONS = [
  { value: "new_lead", label: "New Lead" },
  { value: "researching", label: "Researching" },
  { value: "audited", label: "Audited" },
  { value: "qualified", label: "Qualified" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested" },
  { value: "meeting_booked", label: "Meeting Booked" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>}>
      <LeadsInner />
    </Suspense>
  );
}

interface Lead {
  id: number; company: string; contactName: string | null; email: string | null; phone: string | null;
  website: string | null; industry: string | null; location: string | null;
  leadScore: number; scoreCategory: string; stage: string; recommendedServices: string[] | null;
}

function LeadsInner() {
  const sp = useSearchParams();
  const viewOrg = sp.get("org");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(sp.get("category") || "");
  const [service, setService] = useState("");
  const [sort, setSort] = useState("score");
  const [hasWebsite, setHasWebsite] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20", sort });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (service) params.set("service", service);
    if (hasWebsite) params.set("hasWebsite", hasWebsite);
    if (stageFilter) params.set("stage", stageFilter);
    if (viewOrg) params.set("org", viewOrg);
    const r = await fetch("/api/leads?" + params.toString());
    const d = await r.json();
    setLeads(d.leads || []);
    setTotal(d.total || 0);
    setPages(d.pages || 1);
    setLoading(false);
  }, [page, sort, search, category, service, hasWebsite, stageFilter, viewOrg]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, category, service, hasWebsite, stageFilter, sort]);

  return (
      <div className="mx-auto max-w-7xl space-y-4 animate-fadein">
      {viewOrg && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm">
          <span className="text-indigo-800">
            👁️ <b>Admin view:</b> you are viewing a <b>member's workspace</b> (org {viewOrg}). Members can only see their own data.
          </span>
          <Link href="/leads" className="rounded-lg border border-indigo-300 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
            ← Back to my workspace
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-slate-500">{total} leads · AI-scored & ready for outreach</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">+ New Lead</button>
          <Link href="/import" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">Import</Link>
          <a href="/api/leads/export?limit=100000" className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">⬇ Export CSV (all data)</a>
        </div>
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-2 p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company, email, contact…"
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="w-40">
          <SheetSelect
            value={category}
            onChange={setCategory}
            placeholder="All temperatures"
            options={[
              { value: "", label: "All temperatures" },
              { value: "priority", label: "Priority" },
              { value: "hot", label: "Hot" },
              { value: "warm", label: "Warm" },
              { value: "cold", label: "Cold" },
            ]}
          />
        </div>
        <div className="w-44">
          <SheetSelect
            value={service}
            onChange={setService}
            placeholder="All services"
            options={SERVICE_LIST.map((s) => ({ value: s.key, label: s.name }))}
          />
        </div>
        <div className="w-40">
          <SheetSelect
            value={hasWebsite}
            onChange={setHasWebsite}
            placeholder="Any website"
            options={[
              { value: "", label: "Any website" },
              { value: "yes", label: "Has website" },
              { value: "no", label: "No website" },
            ]}
          />
        </div>
        <div className="w-40">
          <SheetSelect
            value={stageFilter}
            onChange={setStageFilter}
            placeholder="Any stage"
            options={[{ value: "", label: "Any stage" }, ...STAGE_OPTIONS]}
          />
        </div>
        <div className="w-40">
          <SheetSelect
            value={sort}
            onChange={setSort}
            placeholder="Sort"
            options={[
              { value: "score", label: "Sort: Score" },
              { value: "recent", label: "Sort: Recent" },
              { value: "company", label: "Sort: Company A-Z" },
            ]}
          />
        </div>
      </Card>

      {/* Table (desktop) */}
      <Card className="hidden overflow-hidden lg:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Recommended</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={5} className="p-10 text-center"><span className="spinner spinner-dark inline-block" /></td></tr>}
            {!loading && leads.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">No leads found.</td></tr>}
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${l.id}`} className="font-medium text-indigo-700 hover:underline">{l.company}</Link>
                  <div className="text-xs text-slate-500">{l.industry || "—"} · {l.location || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div>{l.contactName || "—"}</div>
                  <div className="text-xs text-slate-500">{l.email || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{l.leadScore}</span>
                    <Badge className={CATEGORY_STYLE[l.scoreCategory]}>{l.scoreCategory}</Badge>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs">{STAGE_LABELS[l.stage] || l.stage}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(l.recommendedServices || []).slice(0, 3).map((s) => (
                      <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{serviceName(s)}</span>
                    ))}
                    {(!l.recommendedServices || l.recommendedServices.length === 0) && <span className="text-xs text-slate-400">Audit to detect</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Cards (mobile) */}
      <div className="space-y-3 lg:hidden">
        {leads.map((l) => (
          <Link key={l.id} href={`/leads/${l.id}`}>
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-indigo-700">{l.company}</div>
                  <div className="text-xs text-slate-500">{l.contactName || l.email || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{l.leadScore}</div>
                  <Badge className={CATEGORY_STYLE[l.scoreCategory]}>{l.scoreCategory}</Badge>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">{STAGE_LABELS[l.stage]} · {l.industry || "—"}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-slate-600">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddLeadModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ company: "", contactName: "", email: "", phone: "", website: "", industry: "", location: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(""); setSaving(true);
    const r = await fetch("/api/leads", { method: "POST", body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) onSaved();
    else { const d = await r.json(); setError(d.error || "Failed"); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg p-6" >
        <div onClick={(e) => e.stopPropagation()}>
          <h2 className="text-lg font-bold">New Lead</h2>
          {error && <div className="mt-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([["company","Company *"],["contactName","Contact Name"],["email","Email"],["phone","Phone"],["website","Website"],["industry","Industry"],["location","Location"]] as const).map(([k, label]) => (
              <div key={k} className={k === "location" ? "sm:col-span-2" : ""}>
                <label className="text-xs font-medium text-slate-600">{label}</label>
                <input
                  value={(form as Record<string,string>)[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
            <button onClick={save} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Create Lead"}</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
