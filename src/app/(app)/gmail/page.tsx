"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Badge, cx } from "@/lib/ui";
import { COMPANY } from "@/lib/services";

interface MsgRow { id: string; threadId: string; snippet: string; timestamp: string | null; labels: string[]; }
interface MsgDetail { id: string; threadId: string; subject: string; from: string; to: string; date: string | null; body: string; hasAttachments: boolean; attachments: string[]; }

const AI_ACTIONS = [
  { key: "summarize", label: "Summarize", icon: "📝" },
  { key: "client-wants", label: "What does the client want?", icon: "🎯" },
  { key: "reply", label: "Write professional reply", icon: "✍️" },
  { key: "shorter", label: "Make shorter", icon: "✂️" },
  { key: "professional", label: "More professional", icon: "💼" },
  { key: "translate", label: "Translate → Bangla", icon: "🌐" },
  { key: "task", label: "Create follow-up task", icon: "✅" },
] as const;

export default function GmailPage() {
  const [status, setStatus] = useState<any>(null);
  const [rows, setRows] = useState<MsgRow[]>([]);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<MsgDetail | null>(null);
  const [aiOut, setAiOut] = useState<{ source: string; text: string; task?: { title: string } } | null>(null);
  const [reply, setReply] = useState("");
  const [replyTarget, setReplyTarget] = useState("");
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [sentOk, setSentOk] = useState("");

  const loadStatus = useCallback(async () => {
    const r = await fetch("/api/gmail/status");
    setStatus(await r.json());
  }, []);

  const loadMessages = useCallback(async (q?: string) => {
    setBusy("list");
    setError("");
    const r = await fetch(`/api/gmail/messages?q=${encodeURIComponent(q || "")}`);
    const d = await r.json();
    if (!d.ok) setError(d.error || "Failed to load inbox");
    else setRows(d.messages || []);
    setBusy("");
  }, []);

  useEffect(() => {
    loadStatus();
    // Handle OAuth return params.
    const p = new URLSearchParams(window.location.search);
    const st = p.get("status");
    if (st && st !== "ok") setError(st);
    if (p.get("email")) loadMessages();
  }, [loadMessages, loadStatus]);

  async function openMsg(id: string) {
    setBusy("msg");
    setError("");
    setAiOut(null);
    setReply("");
    const r = await fetch(`/api/gmail/messages/${encodeURIComponent(id)}`);
    const d = await r.json();
    if (!d.ok) {
      setError(d.error || "Failed to open email");
    } else {
      setDetail(d);
      setReplyTarget(extractAddress(d.from));
      // mark read
      fetch(`/api/gmail/messages/${encodeURIComponent(id)}`, { method: "PATCH" }).catch(() => {});
    }
    setBusy("");
  }

  async function runAi(action: string) {
    if (!detail) return;
    setBusy(`ai-${action}`);
    setAiOut(null);
    const r = await fetch("/api/gmail/ai", {
      method: "POST",
      body: JSON.stringify({
        action,
        text: detail.body,
        sender: detail.from.split("<")[0].trim() || "there",
        subject: detail.subject,
        target: action === "translate" ? "bn" : undefined,
      }),
    });
    const d = await r.json();
    setBusy("");
    if (!d.ok) { setError(d.error || "AI action failed"); return; }
    setAiOut({ source: d.source, text: d.text, task: d.task });
    if (action === "reply") setReply(d.text);
  }

  async function doSend() {
    if (!detail || !reply.trim() || !replyTarget) return;
    setBusy("send");
    setError("");
    setSentOk("");
    const r = await fetch("/api/gmail/send", {
      method: "POST",
      body: JSON.stringify({
        to: replyTarget,
        subject: detail.subject.startsWith("Re:") ? detail.subject : `Re: ${detail.subject}`,
        body: reply,
        threadId: detail.threadId,
        inReplyTo: detail.id,
        aiGenerated: true,
      }),
    });
    const d = await r.json();
    setBusy("");
    if (d.ok) {
      setSentOk(`${d.message} (Gmail message ${d.gmailMessageId}, ${d.sentToday}/${d.dailyCap} today)`);
      loadMessages(query);
    } else {
      setError(d.error || "Send failed");
    }
  }

  async function doDisconnect() {
    if (!confirm("Disconnect Gmail? The token will be revoked.")) return;
    await fetch("/api/gmail/disconnect", { method: "POST" });
    setStatus(null);
    setRows([]);
    setDetail(null);
    loadStatus();
  }

  // ---------- NOT CONFIGURED ----------
  if (status && !status.configured) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 animate-fadein">
        <h1 className="text-2xl font-bold">Gmail</h1>
        <Card className="p-6">
          <div className="text-3xl">🔌</div>
          <h2 className="mt-2 text-lg font-bold">Gmail OAuth — setup required (10 min)</h2>
          <p className="mt-1 text-sm text-slate-500">The integration code is fully live. It only needs Google credentials (never stored in the frontend).</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {[
              `1. Go to Google Cloud Console → APIs & Services → Credentials → Create Credentials → OAuth client ID (Web application).`,
              `2. Add authorized redirect URI: ${typeof window !== "undefined" ? window.location.origin : ""}/api/gmail/callback  (and https://foysalit.com/api/gmail/callback)`,
              `3. Enable the Gmail API for the project.`,
              `4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as server environment variables (Vercel → Environment Variables).`,
              `5. Reload this page and click Connect Gmail.`,
            ].map((s) => (
              <div key={s} className="rounded-lg bg-slate-50 p-3">{s}</div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Requested permissions (and only these): <b>gmail.modify</b> (read your mail, mark read) and <b>gmail.send</b> (send mail). Tokens are encrypted at rest and never exposed to the browser.
          </div>
        </Card>
      </div>
    );
  }

  // ---------- CONNECTED or CONNECT prompt ----------
  return (
    <div className="mx-auto max-w-7xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gmail</h1>
          <p className="text-sm text-slate-500">Real inbox, real AI assistant, real sending via the Gmail API.</p>
        </div>
        {status?.connected ? (
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">● {status.accountEmail}</Badge>
            <button onClick={doDisconnect} className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">Disconnect</button>
          </div>
        ) : (
          <a href="/api/gmail/connect" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Connect Gmail → Google OAuth
          </a>
        )}
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          ⚠️ {error} <button onClick={() => setError("")} className="ml-2 font-semibold underline">Dismiss</button>
        </Card>
      )}

      {!status?.connected ? (
        <Card className="p-10 text-center">
          <div className="text-4xl">✉️</div>
          <h2 className="mt-3 text-lg font-bold">Connect your Gmail account</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Click <b>Connect Gmail</b>, sign in with Google, grant the two permissions, and your real inbox appears here. You can disconnect anytime.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Inbox list */}
          <Card className="lg:col-span-2 flex flex-col">
            <div className="border-b border-slate-100 p-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadMessages(query)}
                placeholder='Search: from:client, "proposal", newer_than:7d…'
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button onClick={() => loadMessages(query)} disabled={busy === "list"} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                  {busy === "list" ? "Loading…" : "Search"}
                </button>
                <button onClick={() => { setQuery(""); loadMessages(""); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Inbox</button>
                <button onClick={() => { setQuery("is:unread"); loadMessages("is:unread"); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Unread</button>
              </div>
            </div>
            <div className="max-h-[60vh] flex-1 divide-y divide-slate-100 overflow-y-auto">
              {rows.length === 0 && <div className="p-8 text-center text-sm text-slate-400">{busy === "list" ? "Loading…" : "No messages"}</div>}
              {rows.map((m) => (
                <button key={m.id} onClick={() => openMsg(m.id)} className={cx("block w-full p-3 text-left hover:bg-slate-50", !m.labels.includes("READ") && "bg-indigo-50/40")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cx("truncate text-sm", !m.labels.includes("READ") ? "font-bold text-slate-900" : "text-slate-700")}>
                      {extractName(m.snippet) || extractName(detail?.from || "")}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">{m.timestamp ? new Date(m.timestamp).toLocaleDateString() : ""}</span>
                  </div>
                  <div className="truncate text-xs text-slate-500">{m.snippet}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Reader + AI */}
          <div className="space-y-4 lg:col-span-3">
            {!detail ? (
              <Card className="p-10 text-center text-sm text-slate-400">Select an email to read it and use the AI assistant.</Card>
            ) : (
              <>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold">{detail.subject || "(no subject)"}</h2>
                    {detail.hasAttachments && <Badge className="border-slate-200 bg-slate-50">📎 {detail.attachments.length}</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    From: <b>{detail.from}</b> · To: {detail.to} {detail.date ? `· ${new Date(detail.date).toUTCString()}` : ""}
                  </div>
                  <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-sans text-sm text-slate-700">
                    {detail.body}
                  </pre>
                </Card>

                {/* AI assistant */}
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">🤖 AI Email Assistant</h3>
                    <span className="text-[10px] text-slate-400">Real computation over this email — never invented</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {AI_ACTIONS.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => runAi(a.key)}
                        disabled={busy.startsWith("ai-")}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                      >
                        {a.icon} {a.label}
                      </button>
                    ))}
                  </div>
                  {busy.startsWith("ai-") && <div className="mt-3 text-sm text-slate-400">Working…</div>}
                  {aiOut && (
                    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                      <div className="text-[10px] font-semibold uppercase text-indigo-500">Result · {aiOut.source}</div>
                      <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-700">{aiOut.text}</pre>
                      {aiOut.task && (
                        <div className="mt-2 rounded-lg bg-white p-2 text-xs">
                          ✅ Task: <b>{aiOut.task.title}</b> (save it in Tasks from the lead page)
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Reply composer */}
                <Card className="p-4">
                  <h3 className="font-semibold">Reply (review → approve → send)</h3>
                  <div className="mt-2 text-xs text-slate-500">To: <b>{replyTarget || "—"}</b> · thread: {detail.threadId.slice(0, 12)}… (stays in the same conversation)</div>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={7}
                    placeholder="Use 'Write professional reply' above, then edit freely before sending."
                    className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button onClick={doSend} disabled={busy === "send" || !reply.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                      {busy === "send" ? "Sending via Gmail API…" : "Approve & Send"}
                    </button>
                    <span className="text-[10px] text-slate-400">Success shows only after the Gmail API confirms. Daily cap 1500, suppression + duplicate checks applied.</span>
                  </div>
                  {sentOk && <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">✅ {sentOk}</div>}
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-slate-400">
        FOYSAL IT · {COMPANY.email} · {COMPANY.whatsapp}
      </div>
    </div>
  );
}

function extractAddress(from: string): string {
  const m = (from || "").match(/<([^>]+)>/);
  return m ? m[1] : from.includes("@") ? from.trim() : "";
}
function extractName(s: string): string {
  const m = (s || "").match(/^[^<>]+</);
  return m ? m[1].trim() : "";
}
