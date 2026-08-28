"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Card, Badge, CATEGORY_STYLE } from "@/lib/ui";

const EXAMPLES = [
  "Show all hot SEO leads",
  "Find businesses that need Local SEO",
  "Which leads have no Meta Pixel?",
  "Show priority leads",
  "How many warm leads?",
  "Generate outreach for my top leads",
  "Create a campaign for priority leads",
];

export default function CommandPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [micOn, setMicOn] = useState(false);
  const recRef = useRef<any>(null);

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (micOn) { try { recRef.current?.stop(); } catch {} setMicOn(false); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (e: any) => setText((e.results[0][0].transcript as string));
    rec.onend = () => setMicOn(false);
    rec.onerror = () => setMicOn(false);
    recRef.current = rec;
    rec.start();
    setMicOn(true);
  }

  async function run(q?: string) {
    const query = q ?? text;
    if (!query.trim()) return;
    setText(query);
    setLoading(true); setResult(null);
    const r = await fetch("/api/command", { method: "POST", body: JSON.stringify({ text: query }) });
    setResult(await r.json());
    setLoading(false);
  }

  async function confirmAction() {
    if (!result?.intent) return;
    // Actions that affect leads/campaigns require confirmation, executed here.
    if (result.intent.action === "create_campaign") {
      await fetch("/api/campaigns", { method: "POST", body: JSON.stringify({ name: "AI: " + text, leadCount: result.count }) });
      alert("Campaign created as draft. Review it in Campaigns before activating.");
    } else if (result.intent.action === "generate_outreach") {
      const leads = result.leads || [];
      let n = 0;
      for (const l of leads.slice(0, 10)) { await fetch(`/api/leads/${l.id}/outreach`, { method: "POST", body: JSON.stringify({ channel: "email" }) }); n++; }
      alert(`Generated ${n} draft messages. Review & approve them in Messages.`);
    }
    setResult({ ...result, intent: { ...result.intent, requiresConfirmation: false } });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">🤖 AI Command Center</h1>
        <p className="text-sm text-slate-500">Ask in plain language. Actions that send messages always ask for confirmation first.</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()} placeholder={micOn ? "Listening…" : "Ask anything about your leads (or tap the mic)…"} className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm" />
          <button onClick={toggleMic} title="Voice command" className={`grid w-11 place-items-center rounded-lg text-lg ${micOn ? "animate-pulse bg-rose-500 text-white" : "border border-slate-300 hover:bg-slate-50"}`}>🎤</button>
          <button onClick={() => run()} disabled={loading} className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "…" : "Ask"}</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => <button key={ex} onClick={() => run(ex)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">{ex}</button>)}
        </div>
      </Card>

      {result && (
        <Card className="p-4">
          <div className="rounded-lg bg-indigo-50 p-3">
            <p className="text-sm text-slate-700">{result.intent.explanation}</p>
          </div>

          {result.intent.requiresConfirmation && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">⚠️ This action needs your confirmation. {result.count} leads match. Nothing is sent to prospects — drafts require separate approval.</p>
              <div className="mt-2 flex gap-2">
                <button onClick={confirmAction} className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white">Confirm</button>
                <button onClick={() => setResult(null)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm">Cancel</button>
              </div>
            </div>
          )}

          {result.resultType === "count" && <div className="mt-3 text-3xl font-bold text-indigo-600">{result.count} leads</div>}

          {result.leads && (
            <div className="mt-3 divide-y divide-slate-100">
              <div className="pb-2 text-sm font-medium text-slate-600">{result.count} results</div>
              {result.leads.map((l: any) => (
                <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between py-2 hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-indigo-700">{l.company}</div>
                    <div className="text-xs text-slate-500">{l.industry || "—"} · {l.location || "—"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{l.leadScore}</span>
                    <Badge className={CATEGORY_STYLE[l.scoreCategory]}>{l.scoreCategory}</Badge>
                  </div>
                </Link>
              ))}
              {result.leads.length === 0 && <div className="py-6 text-center text-sm text-slate-400">No matching leads.</div>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
