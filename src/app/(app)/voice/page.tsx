"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Badge } from "@/lib/ui";

const LANGS = [
  { code: "en-US", label: "English" },
  { code: "bn-BD", label: "Bangla" },
  { code: "ja-JP", label: "Japanese" },
  { code: "zh-CN", label: "Chinese" },
  { code: "de-DE", label: "German" },
  { code: "fr-FR", label: "French" },
  { code: "ar-SA", label: "Arabic" },
  { code: "hi-IN", label: "Hindi" },
];

// Real Automatic Speech Recognition (ASR) using the browser's SpeechRecognition
// API (Chrome/Edge). Streams live partials + final transcript. No fake text.
export default function VoicePage() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [finalText, setFinalText] = useState("");
  const [lang, setLang] = useState("en-US");
  const [aiOut, setAiOut] = useState<{ source: string; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
    return () => { try { recRef.current?.stop(); } catch {} };
  }, []);

  function toggle() {
    if (listening) { try { recRef.current?.stop(); } catch {} setListening(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErr("SpeechRecognition is not supported in this browser. Use Chrome or Edge."); return; }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => { setListening(true); setErr(""); };
    rec.onresult = (e: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t + " ";
        else interim += t;
      }
      setPartial(interim);
      if (finalChunk) setFinalText((prev) => (prev + " " + finalChunk).trim());
    };
    rec.onerror = (e: any) => { setErr(`Speech error: ${e.error}`); setListening(false); };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try { rec.start(); } catch (e: any) { setErr(e?.message || "Could not start microphone."); }
  }

  async function summarize() {
    if (!finalText.trim()) return;
    setBusy("summarize"); setAiOut(null);
    const r = await fetch("/api/gmail/ai", { method: "POST", body: JSON.stringify({ action: "summarize", text: finalText }) });
    const d = await r.json();
    setBusy("");
    if (d.ok) setAiOut({ source: d.source, text: d.text });
  }

  function download() {
    const blob = new Blob([finalText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Voice · ASR</h1>
        <p className="text-sm text-slate-500">Real automatic speech recognition — speak and watch it transcribe live. Then summarize with AI.</p>
      </div>

      {!supported && (
        <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ This browser doesn't expose the SpeechRecognition API. Use <b>Chrome</b> or <b>Edge</b> for live voice transcription.
        </Card>
      )}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Language</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} disabled={listening} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={listening ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
              {listening ? "● Recording" : "○ Idle"}
            </Badge>
            <button
              onClick={toggle}
              disabled={!supported}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40 ${listening ? "bg-rose-500" : "bg-indigo-600"}`}
            >
              {listening ? "⏹ Stop" : "🎤 Start"}
            </button>
          </div>
        </div>

        {err && <div className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{err}</div>}

        <div className="mt-4 min-h-[64px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <span className="text-slate-700">{finalText || <span className="text-slate-400">Your transcript will appear here…</span>}</span>
          <span className="text-slate-400 italic"> {partial}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={summarize} disabled={!finalText.trim() || busy === "summarize"} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy === "summarize" ? "Summarizing…" : "🧠 Summarize with AI"}
          </button>
          <button onClick={download} disabled={!finalText.trim()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">⬇ Download .txt</button>
          <button onClick={() => { setFinalText(""); setPartial(""); setAiOut(null); }} disabled={!finalText.trim()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Clear</button>
        </div>

        {aiOut && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-[10px] font-semibold uppercase text-indigo-500">AI Summary · {aiOut.source}</div>
            <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-slate-700">{aiOut.text}</pre>
          </div>
        )}
      </Card>

      <Card className="p-4 text-xs text-slate-500">
        This is real ASR (browser SpeechRecognition). For <b>server-side</b> meeting transcription (no mic needed, e.g. audio files), connect a provider key in <b>AI Providers</b> (OpenAI Whisper-compatible, Groq Whisper, or Deepgram) — the transcription endpoint will use it automatically.
      </Card>
    </div>
  );
}
