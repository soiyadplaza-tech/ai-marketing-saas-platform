"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, CATEGORY_STYLE, SEVERITY_STYLE, STAGE_LABELS, ScoreRing, timeAgo, cx } from "@/lib/ui";
import { serviceName } from "@/lib/services";
import { serviceAuditMatrix } from "@/lib/opportunities";
import { STAGES } from "@/lib/stages";

interface Detail {
  lead: Record<string, unknown>;
  audit: Record<string, unknown> | null;
  findings: Array<{ id: number; category: string; title: string; detail: string; severity: string; passed: boolean }>;
  opportunities: Array<{ id: number; problem: string; evidence: string; severity: string; businessImpact: string; recommendedService: string; recommendedAction: string; confidence: number }>;
  messages: Array<{ id: number; channel: string; subject: string | null; body: string; status: string; approved: boolean; createdAt: string }>;
  tasks: Array<{ id: number; title: string; status: string; dueAt: string | null }>;
  notes: Array<{ id: number; body: string; author: string; createdAt: string }>;
  activities: Array<{ id: number; type: string; message: string; createdAt: string }>;
}

const TABS = ["Overview", "Website Audit", "Opportunities", "Outreach", "Tasks & Notes", "Timeline"];

export default function LeadProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detail | null>(null);
  const [tab, setTab] = useState("Overview");
  const [auditing, setAuditing] = useState(false);
  const [genChannel, setGenChannel] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/leads/${id}`);
    if (r.ok) setD(await r.json());
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function runAudit() {
    setAuditing(true);
    const r = await fetch(`/api/leads/${id}/audit`, { method: "POST" });
    setAuditing(false);
    if (!r.ok) { const e = await r.json(); alert(e.error || "Audit failed"); return; }
    setTab("Website Audit");
    load();
  }

  async function generate(channel: string) {
    setGenChannel(channel);
    await fetch(`/api/leads/${id}/outreach`, { method: "POST", body: JSON.stringify({ channel }) });
    setGenChannel(null);
    setTab("Outreach");
    load();
  }

  async function updateStage(stage: string) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ stage }) });
    load();
  }

  if (!d) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  const l = d.lead;
  const services = (l.recommendedServices as string[]) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-4 animate-fadein">
      <Link href="/leads" className="text-sm text-indigo-600 hover:underline">← Back to leads</Link>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={(l.leadScore as number) || 0} size={64} />
            <div>
              <h1 className="text-2xl font-bold">{l.company as string}</h1>
              {(l.contactName || l.title) ? (
                <div className="text-sm font-medium text-slate-700">
                  {((l.contactName as string) || "") + (l.title ? ` — ${l.title as string}` : "")}
                </div>
              ) : null}
              <div className="text-sm text-slate-500">{(l.industry as string) || "—"} · {(l.location as string) || "—"}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className={CATEGORY_STYLE[(l.scoreCategory as string) || "cold"]}>{(l.scoreCategory as string)?.toUpperCase()}</Badge>
                {(l.website as string) && <a href={l.website as string} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">🌐 {l.website as string}</a>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={runAudit} disabled={auditing || !l.website} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
              {auditing ? "Auditing…" : "🔍 Run Audit"}
            </button>
            <button onClick={() => generate("email")} disabled={genChannel === "email"} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              {genChannel === "email" ? "…" : "✉️ Email"}
            </button>
            <button onClick={() => generate("whatsapp")} disabled={genChannel === "whatsapp"} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              {genChannel === "whatsapp" ? "…" : "💬 WhatsApp"}
            </button>
            <Link href={`/leads/${id}/report`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">📄 Report</Link>
            <Link href="/nova" className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">🎙️ NOVA Meeting</Link>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
          <Info label="Contact" value={(l.contactName as string) || "—"} />
          <Info label="Email" value={(l.email as string) || "—"} />
          <Info label="Phone" value={(l.phone as string) || "—"} />
          <Info label="Source" value={(l.source as string) || "—"} />
        </div>

        {/* Stage selector */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Pipeline stage:</span>
          <select value={l.stage as string} onChange={(e) => updateStage(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="mb-3 flex flex-wrap gap-1 border-b border-slate-200">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cx("px-3 py-2 text-sm font-medium", tab === t ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800")}>{t}</button>
            ))}
          </div>

          {tab === "Overview" && <OverviewTab d={d} services={services} />}
          {tab === "Website Audit" && <AuditTab d={d} onRun={runAudit} auditing={auditing} />}
          {tab === "Opportunities" && <OpportunitiesTab d={d} />}
          {tab === "Outreach" && <OutreachTab d={d} onReload={load} onGenerate={generate} />}
          {tab === "Tasks & Notes" && <TasksNotesTab d={d} leadId={Number(id)} onReload={load} />}
          {tab === "Timeline" && <TimelineTab d={d} />}
        </div>

        {/* AI side panel */}
        <div>
          <Card className="p-4">
            <h3 className="flex items-center gap-2 font-semibold">🤖 What should I do with this lead?</h3>
            <div className="mt-3 space-y-2 text-sm">
              <AiAdvice d={d} onAudit={runAudit} onGenerate={() => generate("email")} />
            </div>
          </Card>

          <Card className="mt-4 p-4">
            <h3 className="font-semibold">Score Breakdown</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {((l.scoreReasons as string[]) || []).map((r, i) => <li key={i} className="flex gap-1"><span className="text-indigo-500">•</span>{r}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-slate-400">{label}</div>
      <div className="truncate font-medium">{value}</div>
    </div>
  );
}

function AiAdvice({ d, onAudit, onGenerate }: { d: Detail; onAudit: () => void; onGenerate: () => void }) {
  const l = d.lead;
  const advice: { text: string; action?: () => void; cta?: string }[] = [];
  if (!l.auditedAt && l.website) advice.push({ text: "This lead hasn't been audited yet. Run a website audit to detect opportunities and refine the score.", action: onAudit, cta: "Run Audit" });
  if (!l.website) advice.push({ text: "No website on file. Add a website URL to enable AI auditing." });
  if (d.opportunities.length > 0) {
    const top = d.opportunities[0];
    advice.push({ text: `Top opportunity: ${top.problem}. Pitch ${serviceName(top.recommendedService)} — ${top.recommendedAction}` });
  }
  if (d.opportunities.length > 0 && d.messages.length === 0) advice.push({ text: "Opportunities detected but no outreach drafted. Generate a personalized email now.", action: onGenerate, cta: "Generate Email" });
  if ((l.scoreCategory as string) === "priority") advice.push({ text: "🔥 This is a PRIORITY lead — prioritize outreach and consider a call." });
  if (advice.length === 0) advice.push({ text: "Lead looks ready. Move it through the pipeline as you engage." });

  return (
    <>
      {advice.map((a, i) => (
        <div key={i} className="rounded-lg bg-indigo-50 p-3">
          <p className="text-slate-700">{a.text}</p>
          {a.action && <button onClick={a.action} className="mt-2 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">{a.cta}</button>}
        </div>
      ))}
    </>
  );
}

function OverviewTab({ d, services }: { d: Detail; services: string[] }) {
  const l = d.lead;
  const scores = [
    { label: "Website", v: l.websiteScore as number | null },
    { label: "SEO", v: l.seoScore as number | null },
    { label: "Local SEO", v: l.localSeoScore as number | null },
    { label: "Social", v: l.socialScore as number | null },
  ];
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Score Overview</h3>
        <div className="grid grid-cols-4 gap-3">
          {scores.map((s) => (
            <div key={s.label} className="rounded-lg border border-slate-200 p-3 text-center">
              <div className="text-2xl font-bold">{s.v ?? "—"}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
      {d.audit?.data ? (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">A→Z Service Audit Matrix</h3>
          <div className="grid gap-1 sm:grid-cols-2">
            {serviceAuditMatrix(d.audit.data as any).map((m) => (
              <div key={m.service} className="flex items-center justify-between rounded border border-slate-100 px-2 py-1.5 text-xs" title={m.evidence}>
                <span>{serviceName(m.service)}</span>
                <span className={m.status === "strong" ? "font-bold text-emerald-600" : m.status === "gap" ? "font-bold text-amber-600" : "text-slate-400"}>
                  {m.status === "strong" ? "✓ Covered" : m.status === "gap" ? "⚠ Gap" : "— Check"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <h3 className="mb-2 font-semibold">Recommended FOYSAL IT Services</h3>
        {services.length === 0 ? <p className="text-sm text-slate-400">Run an audit to generate recommendations.</p> : (
          <div className="flex flex-wrap gap-2">
            {services.map((s) => <Badge key={s} className="border-indigo-200 bg-indigo-50 text-indigo-700">{serviceName(s)}</Badge>)}
          </div>
        )}
      </Card>

      {(() => {
        const social = (l.socialProfiles as Record<string, string>) || {};
        const tags = (l.tags as string[]) || [];
        const enrichment = (l.enrichment as Record<string, string>) || {};
        const socialKeys = Object.keys(social);
        const enrichEntries = Object.entries(enrichment);
        if (socialKeys.length === 0 && tags.length === 0 && enrichEntries.length === 0) return null;
        return (
          <>
            {socialKeys.length > 0 && (
              <Card className="p-4">
                <h3 className="mb-2 font-semibold">Social Profiles</h3>
                <div className="flex flex-wrap gap-2">
                  {socialKeys.map((k) => (
                    <a key={k} href={social[k]} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-indigo-600 hover:bg-slate-50 capitalize">{k} ↗</a>
                  ))}
                </div>
              </Card>
            )}
            {tags.length > 0 && (
              <Card className="p-4">
                <h3 className="mb-2 font-semibold">Keywords / Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t}</span>)}
                </div>
              </Card>
            )}
            {enrichEntries.length > 0 && (
              <Card className="p-4">
                <h3 className="mb-2 font-semibold">All Imported Data ({enrichEntries.length} fields)</h3>
                <div className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                  {enrichEntries.map(([k, v]) => (
                    <div key={k} className="flex gap-2 border-b border-slate-50 py-0.5">
                      <span className="min-w-32 shrink-0 text-xs font-medium uppercase text-slate-400">{k}</span>
                      <span className="break-all text-slate-700">{v}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        );
      })()}
    </div>
  );
}

function AuditTab({ d, onRun, auditing }: { d: Detail; onRun: () => void; auditing: boolean }) {
  const a = d.audit;
  if (!a) return (
    <Card className="p-8 text-center">
      <p className="text-slate-500">No audit yet.</p>
      <button onClick={onRun} disabled={auditing} className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{auditing ? "Auditing…" : "Run Website Audit"}</button>
    </Card>
  );
  if (a.status === "failed") return (
    <Card className="p-6">
      <p className="font-medium text-rose-600">Audit failed: {a.error as string}</p>
      <button onClick={onRun} className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm">Retry</button>
    </Card>
  );
  const cats: [string, number][] = [
    ["Technical", a.technicalScore as number], ["On-Page", a.onpageScore as number], ["Performance", a.performanceScore as number],
    ["Conversion", a.conversionScore as number], ["Local", a.localScore as number], ["Social", a.socialScore as number],
  ];
  const catFilters = ["technical", "onpage", "performance", "conversion", "local", "social", "tracking"];
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={(a.overallScore as number) || 0} size={64} />
          <div>
            <div className="font-semibold">Overall Website Score</div>
            <div className="text-sm text-slate-500">Audited {timeAgo(a.createdAt as string)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {cats.map(([label, v]) => (
            <div key={label} className="rounded-lg border border-slate-200 p-2 text-center">
              <div className="text-lg font-bold">{v ?? "—"}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </Card>
      {catFilters.map((cat) => {
        const items = d.findings.filter((f) => f.category === cat);
        if (items.length === 0) return null;
        return (
          <Card key={cat} className="p-4">
            <h3 className="mb-2 font-semibold capitalize">{cat === "onpage" ? "On-Page SEO" : cat} Findings</h3>
            <div className="space-y-2">
              {items.map((f) => (
                <div key={f.id} className="flex items-start gap-2 rounded-lg border border-slate-100 p-2">
                  <span>{f.passed ? "✅" : f.severity === "critical" ? "🔴" : f.severity === "warning" ? "🟡" : "🔵"}</span>
                  <div>
                    <div className="text-sm font-medium">{f.title}</div>
                    <div className="text-xs text-slate-500">{f.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function OpportunitiesTab({ d }: { d: Detail }) {
  if (d.opportunities.length === 0) return <Card className="p-8 text-center text-slate-400">No opportunities yet. Run a website audit.</Card>;
  return (
    <div className="space-y-3">
      {d.opportunities.map((o) => (
        <Card key={o.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{o.problem}</h3>
            <Badge className={SEVERITY_STYLE[o.severity]}>{o.severity}</Badge>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <p><span className="font-medium text-slate-500">Evidence:</span> {o.evidence}</p>
            <p><span className="font-medium text-slate-500">Business impact:</span> {o.businessImpact}</p>
            <p><span className="font-medium text-slate-500">Recommended service:</span> <span className="text-indigo-700">{serviceName(o.recommendedService)}</span></p>
            <p><span className="font-medium text-slate-500">Next action:</span> {o.recommendedAction}</p>
          </div>
          <div className="mt-2"><Badge className="border-slate-200 bg-slate-50 text-slate-600">Confidence: {o.confidence}%</Badge></div>
        </Card>
      ))}
    </div>
  );
}

function OutreachTab({ d, onReload, onGenerate }: { d: Detail; onReload: () => void; onGenerate: (c: string) => void }) {
  async function approve(id: number) { await fetch("/api/messages", { method: "PATCH", body: JSON.stringify({ id, action: "approve" }) }); onReload(); }
  async function send(id: number) {
    const r = await fetch("/api/messages", { method: "PATCH", body: JSON.stringify({ id, action: "send" }) });
    const data = await r.json();
    if (!r.ok) alert(data.message || "Sending requires a connected provider (Integrations).");
    onReload();
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => onGenerate("email")} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Generate Email</button>
        <button onClick={() => onGenerate("whatsapp")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">Generate WhatsApp</button>
      </div>
      {d.messages.length === 0 && <Card className="p-8 text-center text-slate-400">No messages yet. Generate a personalized draft.</Card>}
      {d.messages.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="border-slate-200 bg-slate-50">{m.channel === "whatsapp" ? "💬 WhatsApp" : "✉️ Email"}</Badge>
              <Badge className={m.status === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : m.approved ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{m.status}</Badge>
            </div>
            <span className="text-xs text-slate-400">{timeAgo(m.createdAt)}</span>
          </div>
          {m.subject && <div className="mt-2 font-medium">{m.subject}</div>}
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-700">{m.body}</pre>
          <div className="mt-3 flex gap-2">
            {!m.approved && <button onClick={() => approve(m.id)} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Approve</button>}
            {m.approved && m.status !== "sent" && <button onClick={() => send(m.id)} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold">Send</button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function TasksNotesTab({ d, leadId, onReload }: { d: Detail; leadId: number; onReload: () => void }) {
  const [note, setNote] = useState("");
  const [task, setTask] = useState("");
  async function addNote() { if (!note.trim()) return; await fetch("/api/notes", { method: "POST", body: JSON.stringify({ leadId, body: note }) }); setNote(""); onReload(); }
  async function addTask() { if (!task.trim()) return; await fetch("/api/tasks", { method: "POST", body: JSON.stringify({ leadId, title: task }) }); setTask(""); onReload(); }
  async function toggleTask(id: number, status: string) { await fetch("/api/tasks", { method: "PATCH", body: JSON.stringify({ id, status: status === "done" ? "open" : "done" }) }); onReload(); }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-2 font-semibold">Tasks</h3>
        <div className="flex gap-2">
          <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="New task…" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          <button onClick={addTask} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Add</button>
        </div>
        <div className="mt-3 space-y-2">
          {d.tasks.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={t.status === "done"} onChange={() => toggleTask(t.id, t.status)} />
              <span className={t.status === "done" ? "line-through text-slate-400" : ""}>{t.title}</span>
            </label>
          ))}
          {d.tasks.length === 0 && <p className="text-xs text-slate-400">No tasks.</p>}
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="mb-2 font-semibold">Notes</h3>
        <div className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          <button onClick={addNote} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">Add</button>
        </div>
        <div className="mt-3 space-y-2">
          {d.notes.map((n) => (
            <div key={n.id} className="rounded-lg bg-slate-50 p-2 text-sm">
              <p>{n.body}</p>
              <div className="mt-1 text-[10px] text-slate-400">{n.author} · {timeAgo(n.createdAt)}</div>
            </div>
          ))}
          {d.notes.length === 0 && <p className="text-xs text-slate-400">No notes.</p>}
        </div>
      </Card>
    </div>
  );
}

function TimelineTab({ d }: { d: Detail }) {
  if (d.activities.length === 0) return <Card className="p-8 text-center text-slate-400">No activity yet.</Card>;
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {d.activities.map((a) => (
          <div key={a.id} className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
            <div>
              <div className="text-sm">{a.message}</div>
              <div className="text-xs text-slate-400">{timeAgo(a.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
