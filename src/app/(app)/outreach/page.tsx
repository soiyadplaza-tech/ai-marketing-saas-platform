"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, timeAgo } from "@/lib/ui";

interface Msg { id: number; channel: string; subject: string | null; body: string; status: string; approved: boolean; createdAt: string; company: string | null; leadId: number | null; }

const FILTERS = [["", "All"], ["draft", "Drafts"], ["approved", "Approved"], ["sent", "Sent"], ["replied", "Replied"]];

interface Quota { minTarget: number; maxLimit: number; dailyLimit: number; sentToday: number; remainingToday: number; targetRemaining: number; }

function BulkSendApproved({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(400);
  const [sendBatch, setSendBatch] = useState(10);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [msg, setMsg] = useState("");

  async function loadQuota() {
    const r = await fetch(`/api/outreach/quota?dailyLimit=${dailyLimit}`);
    setQuota(await r.json());
  }
  useEffect(() => { loadQuota(); }, []);

  async function send() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/outreach/send-approved", { method: "POST", body: JSON.stringify({ dailyLimit, limit: sendBatch }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) setMsg(d.message || d.error || "Send failed");
    else setMsg(`Sent ${d.sent} (small batch), skipped ${d.skipped}, failed ${d.failed}. Provider: ${d.provider}.`);
    await loadQuota();
    onDone();
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold">Email Sending Control</h3>
      <p className="text-xs text-slate-500">Send approved messages in small batches. Daily target: 400 minimum · hard cap: 1500 maximum.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={sendBatch} onChange={(e) => setSendBatch(Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value={10}>Send next 10</option>
          <option value={25}>Send next 25</option>
          <option value={50}>Send next 50</option>
        </select>
        <input type="number" min={400} max={1500} value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} onBlur={loadQuota} className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm" title="Daily send limit" />
        <button onClick={loadQuota} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold">Refresh Quota</button>
        <button onClick={send} disabled={busy || (quota?.remainingToday ?? 0) <= 0} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Send Small Batch"}</button>
      </div>
      {quota && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-2"><b>{quota.sentToday}</b><br />sent today</div>
          <div className="rounded-lg bg-slate-50 p-2"><b>{quota.remainingToday}</b><br />remaining</div>
          <div className="rounded-lg bg-slate-50 p-2"><b>{quota.minTarget}</b><br />min target</div>
          <div className="rounded-lg bg-slate-50 p-2"><b>{quota.maxLimit}</b><br />max cap</div>
        </div>
      )}
      {msg && <div className={`mt-2 rounded-lg p-2 text-sm ${msg.includes("Sent") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{msg}</div>}
    </Card>
  );
}

function BatchApprove({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState(10);
  const [msg, setMsg] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  async function loadRemaining() {
    const r = await fetch("/api/messages?status=draft");
    const d = await r.json();
    setRemaining(d.messages?.length ?? 0);
  }
  useEffect(() => { loadRemaining(); }, []);

  async function approve() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/outreach/approve-batch", { method: "POST", body: JSON.stringify({ limit: size }) });
    const d = await r.json();
    setBusy(false);
    setMsg(`Approved ${d.approved} draft(s) in a small batch. ${d.remainingDrafts} still pending.`);
    setRemaining(d.remainingDrafts);
    onDone();
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Approve in Small Batches</h3>
        {remaining != null && <Badge className="border-slate-200 bg-slate-50 text-slate-600">{remaining} drafts pending</Badge>}
      </div>
      <p className="text-xs text-slate-500">Review & approve messages in controlled chunks — never the whole list at once. Pick a small batch size, then approve.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={size} onChange={(e) => setSize(Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value={5}>Next 5</option>
          <option value={10}>Next 10</option>
          <option value={25}>Next 25</option>
        </select>
        <button onClick={approve} disabled={busy || (remaining ?? 0) === 0} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Approving…" : "Approve Batch"}
        </button>
      </div>
      {msg && <div className="mt-2 rounded-lg bg-sky-50 p-2 text-sm text-sky-700">{msg}</div>}
    </Card>
  );
}

function DailySend({ onDone }: { onDone: () => void }) {
  const [limit, setLimit] = useState(400);
  const [quota, setQuota] = useState<{ sentToday: number; remainingToday: number; minTarget: number; maxLimit: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/outreach/quota?dailyLimit=${limit}`).then((r) => r.json()).then(setQuota).catch(() => {});
  }, [limit]);

  async function run() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/outreach/daily-send", { method: "POST", body: JSON.stringify({ dailyLimit: limit }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(d.error || "Send failed"); return; }
    setMsg(`Sent ${d.sent} email(s) today (${d.failed} failed, ${d.skipped} skipped). ${d.quota?.remainingToday ?? 0} remaining today.`);
    onDone();
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold">Daily Send (400 min / 1500 max)</h3>
      <p className="text-xs text-slate-500">Send personalized outreach to top leads up to your daily limit. Auto-generates + sends to uncontacted leads.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600">Daily limit</label>
        <input type="number" min={400} max={1500} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={run} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Sending…" : "Run Daily Send"}</button>
      </div>
      {quota && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span>Min target: <b>{quota.minTarget}</b></span>
          <span>Max: <b>{quota.maxLimit}</b></span>
          <span>Sent today: <b>{quota.sentToday}</b></span>
          <span>Remaining: <b>{quota.remainingToday}</b></span>
        </div>
      )}
      {msg && <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{msg}</div>}
    </Card>
  );
}

function BatchGenerate({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState("");
  const [channel, setChannel] = useState("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/outreach/batch", { method: "POST", body: JSON.stringify({ category: category || undefined, channel, limit: 100 }) });
    const d = await r.json();
    setBusy(false);
    setMsg(`Generated ${d.created} draft(s). Review & approve below before sending.`);
    onDone();
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold">Batch Generate Outreach Drafts</h3>
      <p className="text-xs text-slate-500">Create personalized drafts for many leads at once. Nothing is sent — drafts require approval.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All leads</option>
          <option value="priority">Priority only</option>
          <option value="hot">Hot only</option>
          <option value="warm">Warm only</option>
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <button onClick={run} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Generating…" : "Generate Drafts"}</button>
      </div>
      {msg && <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{msg}</div>}
    </Card>
  );
}

export default function OutreachPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/messages" + (filter ? `?status=${filter}` : ""));
    const d = await r.json();
    setMsgs(d.messages || []);
    setLoading(false);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function act(id: number, action: string) {
    const r = await fetch("/api/messages", { method: "PATCH", body: JSON.stringify({ id, action }) });
    const d = await r.json();
    if (!r.ok && action === "send") alert(d.message || "A provider must be connected to send. See Integrations.");
    load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-slate-500">AI-generated outreach with human approval. Real sending requires a connected provider.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([v, label]) => (
          <button key={v} onClick={() => setFilter(v)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === v ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white"}`}>{label}</button>
        ))}
      </div>

      <BatchGenerate onDone={load} />
      <DailySend onDone={load} />
      <BatchApprove onDone={load} />
      <BulkSendApproved onDone={load} />

      <Card className="border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        ⚠️ Responsible outreach: messages are drafts until you approve them. Sending needs a connected Email/WhatsApp provider (Integrations). We never simulate sends.
      </Card>

      {loading && <Card className="p-10 text-center"><span className="spinner spinner-dark mx-auto" /></Card>}
      {!loading && msgs.length === 0 && <Card className="p-10 text-center text-slate-400">No messages. Generate outreach from a lead profile.</Card>}

      {msgs.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="border-slate-200 bg-slate-50">{m.channel === "whatsapp" ? "💬" : "✉️"} {m.company || "—"}</Badge>
              <Badge className={m.status === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : m.approved ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{m.status}</Badge>
            </div>
            <span className="text-xs text-slate-400">{timeAgo(m.createdAt)}</span>
          </div>
          {m.subject && <div className="mt-2 font-medium">{m.subject}</div>}
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-sm text-slate-600">{m.body}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.leadId && <Link href={`/leads/${m.leadId}`} className="rounded-md border border-slate-300 px-3 py-1 text-xs">Open lead</Link>}
            {!m.approved && <button onClick={() => act(m.id, "approve")} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Approve</button>}
            {m.approved && m.status !== "sent" && <button onClick={() => act(m.id, "send")} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold">Send</button>}
          </div>
        </Card>
      ))}
    </div>
  );
}
