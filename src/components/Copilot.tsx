"use client";

import { useEffect, useRef, useState } from "react";

interface Msg { from: "ai" | "me"; text: string; }

export default function Copilot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "I'm the FOYSAL Copilot — one brain for everything: your numbers, your leads, and 30 years of marketing playbooks. Ask me anything, or tap the mic." },
  ]);
  const [input, setInput] = useState("");
  const [quick, setQuick] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [voiceOut, setVoiceOut] = useState(true);
  const recRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  // Speech recognition (voice assistant input)
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || !open) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setMicOn(false);
    rec.onerror = () => setMicOn(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, [open]);

  function speak(text: string) {
    if (!voiceOut || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      const clean = text.replace(/[•📚✆💬🚀✅⚠️→]/g, " ").replace(/\n+/g, ". ");
      const u = new SpeechSynthesisUtterance(clean.slice(0, 900));
      u.rate = 1.02;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  async function ask(q: string) {
    const query = q.trim();
    if (!query || busy) return;
    setBusy(true);
    setMsgs((m) => [...m, { from: "me", text: query }]);
    setInput("");
    try {
      const r = await fetch("/api/copilot", { method: "POST", body: JSON.stringify({ text: query }) });
      const d = await r.json();
      setMsgs((m) => [...m, { from: "ai", text: d.reply || "No response." }]);
      setQuick(d.quick || []);
      speak(d.reply || "");
    } catch {
      setMsgs((m) => [...m, { from: "ai", text: "Network hiccup — please try again." }]);
    }
    setBusy(false);
  }

  function toggleMic() {
    const rec = recRef.current;
    if (!rec) return;
    if (micOn) { rec.stop(); setMicOn(false); }
    else { try { rec.start(); setMicOn(true); } catch {} }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-3 font-bold text-white shadow-xl shadow-fuchsia-500/30 transition hover:scale-105"
        aria-label="AI Copilot"
      >
        <img src="/images/logo.png" alt="" className="h-6 w-6 rounded-full ring-1 ring-white/40" />
        <span className="hidden sm:inline">AI Copilot</span>
        <span className="sm:hidden">AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[70vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#2a0a3a] to-[#6d28d9] px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <img src="/images/logo.png" alt="" className="h-9 w-9 rounded-lg ring-1 ring-white/30" />
                <div>
                  <div className="text-sm font-bold">FOYSAL Copilot</div>
                  <div className="text-[10px] text-fuchsia-200/80">All-in-one AI · 30-year marketing brain</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVoiceOut(!voiceOut)}
                  title="Voice output"
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${voiceOut ? "bg-white/20" : "bg-white/5 text-white/50"}`}
                >
                  {voiceOut ? "🔊" : "🔇"}
                </button>
                <button onClick={() => setOpen(false)} className="rounded-lg bg-white/10 px-2 py-1 text-sm">✕</button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.from === "me" ? "bg-purple-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">Thinking…</div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {quick.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
                {quick.map((q) => (
                  <button key={q} onClick={() => ask(q)} className="shrink-0 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100">
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
              <button
                onClick={toggleMic}
                title="Voice assistant"
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg ${micOn ? "animate-pulse bg-rose-500 text-white" : "border border-slate-300 hover:bg-slate-50"}`}
              >
                🎤
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask(input)}
                placeholder={micOn ? "Listening…" : "Ask the Copilot anything…"}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500"
              />
              <button onClick={() => ask(input)} disabled={busy || !input.trim()} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
