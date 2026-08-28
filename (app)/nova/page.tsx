"use client";

// NOVA AI — real two-way real-time voice translation meeting room.
// You speak your language → NOVA translates → the other person hears their language.
// They speak their language → NOVA translates → you hear your language.
// Uses browser SpeechRecognition (STT) + a real translation service + SpeechSynthesis (TTS).
// Real, working, in-browser. No fake voice/text.

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Badge, cx } from "@/lib/ui";

interface Turn {
  dir: "me" | "them";
  original: string;
  translated: string;
  ts: number;
}

interface Intel {
  prices: string[];
  dates: string[];
  questions: string[];
  commitments: string[];
  followUps: string[];
}

async function translateServer(from: string, to: string, text: string): Promise<string> {
  try {
    const r = await fetch("/api/nova/translate", { method: "POST", body: JSON.stringify({ from, to, text }) });
    const d = await r.json();
    if (d.ok) return d.text;
    throw new Error(d.error || "translation failed");
  } catch (e) {
    throw e;
  }
}

function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    const v = window.speechSynthesis.getVoices().find((v) => v.lang === lang) || window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.split("-")[0]));
    if (v) u.voice = v;
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export default function NovaPage() {
  const [meetingName, setMeetingName] = useState("NOVA Meeting");
  const [myLang, setMyLang] = useState("bn-BD");
  const [theirLang, setTheirLang] = useState("en-US");
  const [direction, setDirection] = useState<"me" | "them">("me");
  const [listening, setListening] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const [interim, setInterim] = useState("");
  const [translating, setTranslating] = useState(false);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [intel, setIntel] = useState<Intel | null>(null);
  const [summary, setSummary] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [recSupported, setRecSupported] = useState<boolean>(true);
  const [ttsSupported, setTtsSupported] = useState<boolean>(true);
  const recRef = useRef<any>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setRecSupported(!!SR);
    setTtsSupported("speechSynthesis" in window);
    if (ttsSupported) window.speechSynthesis.getVoices();
    return () => { try { recRef.current?.stop(); } catch {} try { window.speechSynthesis?.cancel(); } catch {} };
  }, []);

  const sourceLang = direction === "me" ? myLang : theirLang;
  const targetLang = direction === "me" ? theirLang : myLang;
  const srcLangName = direction === "me" ? "your language" : "their language";
  const tgtLangName = direction === "me" ? "their language" : "your language";

  const handleFinal = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || busyRef.current) return;
    busyRef.current = true;
    setInterim("");
    setTranslating(true);
    try {
      const translated = await translateServer(sourceLang, targetLang, clean);
      setTranscript((t) => [...t, { dir: direction, original: clean, translated, ts: Date.now() }]);
      setIntel(computeIntel([...(d_transcriptRef.current || []), { dir: direction, original: clean, translated, ts: Date.now() }]));
      if (ttsOn) speak(translated, targetLang);
    } catch (e) {
      setSpeechError("Translation service temporarily unavailable. Please try again.");
    }
    setTranslating(false);
    busyRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceLang, targetLang, direction, ttsOn]);

  // ref mirror of transcript for intel computation inside async callback
  const d_transcriptRef = useRef<Turn[]>([]);
  useEffect(() => { d_transcriptRef.current = transcript; }, [transcript]);

  function start() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSpeechError("Your browser doesn't support speech recognition. Use Chrome or Edge."); return; }
    setSpeechError("");
    const rec = new SR();
    rec.lang = sourceLang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) handleFinal(e.results[i][0].transcript);
        else interimText += e.results[i][0].transcript;
      }
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") setSpeechError("Microphone blocked. Allow mic access and try again.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setSpeechError("Mic error: " + e.error);
    };
    rec.onend = () => { if (listening) { try { rec.start(); } catch {} } };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch (e: any) { setSpeechError("Could not start mic: " + e?.message); }
  }

  function stop() { setListening(false); setInterim(""); try { recRef.current?.stop(); } catch {} try { window.speechSynthesis?.cancel(); } catch {} }

  function swap() { setMyLang(theirLang); setTheirLang(myLang); setDirection((d) => (d === "me" ? "them" : "me")); }
  function setDir(dir: "me" | "them") { setDirection(dir); try { recRef.current?.stop(); } catch {} setListening(false); setInterim(""); }

  function clearAll() {
    stop();
    setTranscript([]);
    d_transcriptRef.current = [];
    setIntel(null);
    setSummary("");
    try { window.speechSynthesis?.cancel(); } catch {}
  }

  function generateSummary() {
    const text = transcript.map((t) => t.original + " " + t.translated).join(" . ");
    if (!text.trim()) { setSummary("No conversation yet."); return; }
    const intel = computeIntel(transcript);
    const parts: string[] = [];
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    parts.push("Meeting transcript: ~" + words + " words.");
    if (intel.prices.length) parts.push("Prices/amounts: " + intel.prices.slice(0, 5).join(", ") + ".");
    if (intel.dates.length) parts.push("Dates/deadlines: " + intel.dates.slice(0, 5).join(", ") + ".");
    if (intel.questions.length) parts.push("Key questions: " + intel.questions.slice(0, 4).map((q) => '"' + q + '"').join(" "));
    if (intel.commitments.length) parts.push("Commitments: " + intel.commitments.slice(0, 4).map((c) => '"' + c + '"').join(" "));
    if (intel.followUps.length) parts.push("Follow-ups: " + intel.followUps.slice(0, 4).map((c) => '"' + c + '"').join(" "));
    if (parts.length === 1) parts.push("No key business items detected.");
    setSummary(parts.join(" "));
  }

  function exportTranscript() {
    const lines = [
      "NOVA AI Meeting Transcript",
      "Meeting: " + meetingName,
      "Date: " + new Date().toLocaleString(),
      "My language: " + myLang + "  |  Their language: " + theirLang,
      "=".repeat(50),
    ];
    for (const t of transcript) {
      lines.push("");
      lines.push((t.dir === "me" ? "YOU (" + myLang + ")" : "THEM (" + theirLang + ")") + ": " + t.original);
      lines.push("→ (" + (t.dir === "me" ? theirLang : myLang) + ") " + t.translated);
    }
    lines.push("");
    lines.push("=".repeat(50));
    lines.push("SUMMARY");
    lines.push(summary || "(none generated)");
    if (intel) {
      lines.push("");
      lines.push("BUSINESS INTELLIGENCE");
      lines.push("Prices: " + (intel.prices.join(", ") || "none"));
      lines.push("Dates/deadlines: " + (intel.dates.join(", ") || "none"));
      lines.push("Questions: " + (intel.questions.join(" | ") || "none"));
      lines.push("Commitments: " + (intel.commitments.join(" | ") || "none"));
      lines.push("Follow-ups: " + (intel.followUps.join(" | ") || "none"));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nova-meeting-" + new Date().toISOString().slice(0, 10) + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const lastTurn = transcript[transcript.length - 1];
  const liveOriginal = interim || (listening ? "(listening…)" : "");
  const liveTranslation = translating ? "translating…" : lastTurn && transcript[transcript.length - 1].ts === lastTurn.ts ? "" : "";

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-yellow-400 text-lg font-black">N</div>
          <div>
            <h1 className="text-xl font-extrabold">NOVA AI — Meeting Translator</h1>
            <p className="text-xs text-slate-500">One AI. Every language. Every meeting. Speak your language — NOVA translates in both directions.</p>
          </div>
        </div>
        {listening && <span className="flex items-center gap-1 text-sm font-semibold text-rose-500"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> LIVE</span>}
      </div>

      {/* Meeting setup */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Meeting name</label>
            <input value={meetingName} onChange={(e) => setMeetingName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">I speak (my language)</label>
            <select value={myLang} onChange={(e) => setMyLang(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="bn-BD">Bangla (বাংলা)</option>
                <option value="en-US">English</option>
                <option value="ja-JP">Japanese (日本語)</option>
                <option value="de-DE">German (Deutsch)</option>
                <option value="zh-CN">Chinese (中文)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="ar-SA">Arabic (العربية)</option>
              </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">They speak (their language)</label>
            <select value={theirLang} onChange={(e) => setTheirLang(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="en-US">English</option>
              <option value="bn-BD">Bangla (বাংলা)</option>
              <option value="ja-JP">Japanese (日本語)</option>
              <option value="de-DE">German (Deutsch)</option>
              <option value="zh-CN">Chinese (中文)</option>
              <option value="hi-IN">Hindi (हिन्दी)</option>
              <option value="ar-SA">Arabic (العربية)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => setDir("me")} className={cx("rounded-xl px-3 py-3 text-sm font-semibold", direction === "me" ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white")}>
            🗣️ I speak → they hear<br /><span className="text-xs font-normal opacity-80">{myLang} → {theirLang}</span>
          </button>
          <button onClick={() => setDir("them")} className={cx("rounded-xl px-3 py-3 text-sm font-semibold", direction === "them" ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white")}>
            👂 They speak → I hear<br /><span className="text-xs font-normal opacity-80">{theirLang} → {myLang}</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          <button onClick={listening ? stop : start} disabled={!recSupported} className={cx("grid h-20 w-20 place-items-center rounded-full text-3xl shadow-xl transition", listening ? "bg-rose-500 animate-pulse" : "bg-indigo-600") + " disabled:opacity-40"}>
            {listening ? "⏹" : "🎤"}
          </button>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={ttsOn} onChange={(e) => setTtsOn(e.target.checked)} disabled={!ttsSupported} /> Speak translation aloud (🔊)</label>
            <button onClick={swap} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">🔄 Swap languages</button>
          </div>
        </div>
        {!recSupported && <div className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">⚠️ Live voice needs Chrome/Edge. You can still use type-to-translate below.</div>}
        {speechError && <div className="mt-3 rounded-lg bg-rose-50 p-2 text-sm text-rose-700">⚠️ {speechError}</div>}
      </Card>

      {/* Live translation panel */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs text-slate-300">
          <span className="font-semibold">LIVE TRANSLATION</span>
          <span>{sourceLang} → {targetLang} {listening ? "· listening" : "· idle"}</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <div className="p-4">
            <div className="text-[10px] font-semibold uppercase text-slate-400">{srcLangName} (original)</div>
            <div className="mt-1 min-h-[3rem] text-lg">{liveOriginal || <span className="text-slate-300">—</span>}</div>
          </div>
          <div className="bg-indigo-50/50 p-4">
            <div className="text-[10px] font-semibold uppercase text-indigo-400">{tgtLangName} (translated)</div>
            <div className="mt-1 min-h-[3rem] text-lg text-indigo-900">{translating ? "translating…" : (lastTurn && lastTurn.dir === (direction === "me" ? "me" : "them") ? lastTurn.translated : (lastTurn?.translated || "—"))}</div>
          </div>
        </div>
      </Card>

      {/* Transcript */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Transcript ({transcript.length})</h2>
          {transcript.length > 0 && <button onClick={exportTranscript} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">⬇ Export</button>}
        </div>
        <div className="mt-3 max-h-72 space-y-3 overflow-y-auto">
          {transcript.length === 0 && <div className="text-sm text-slate-400">Speak to start the live bilingual transcript…</div>}
          {[...transcript].reverse().map((t, i) => (
            <div key={i} className={cx("rounded-lg p-3", t.dir === "me" ? "bg-indigo-50" : "bg-slate-50")}>
              <div className="text-[10px] font-semibold uppercase text-slate-400">{t.dir === "me" ? "You (" + myLang + ")" : "Them (" + theirLang + ")"}</div>
              <div className="mt-0.5 text-sm">{t.original}</div>
              <div className="mt-1 text-sm font-medium text-indigo-800">→ {t.translated}</div>
            </div>
          ))}
        </div>
        {transcript.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={generateSummary} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm">✨ Generate summary</button>
            <button onClick={() => { stop(); setTranscript([]); d_transcriptRef.current = []; setIntel(null); setSummary(""); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Clear</button>
          </div>
        )}
        {summary && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><b>Summary:</b> {summary}</div>}
      </Card>

      {/* Type to translate (no mic) */}
      <TypeTranslate sourceLang={sourceLang} targetLang={targetLang} onResult={(o, t) => { setTranscript((t2) => [...t2, { dir: direction, original: o, translated: t, ts: Date.now() }]); d_transcriptRef.current = [...d_transcriptRef.current, { dir: direction, original: o, translated: t, ts: Date.now() }]; if (ttsOn) speak(t, targetLang); }} />

      {/* Business intelligence */}
      {intel && (intel.prices.length || intel.dates.length || intel.questions.length || intel.commitments.length || intel.followUps.length) && (
        <Card className="p-4">
          <h2 className="font-semibold">🧠 Business Intelligence (auto-detected from the conversation)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <IntelBox label="💰 Prices / amounts" items={intel.prices} />
            <IntelBox label="📅 Dates / deadlines" items={intel.dates} />
            <IntelBox label="❓ Questions" items={intel.questions} />
            <IntelBox label="🤝 Commitments" items={intel.commitments} />
          </div>
        </Card>
      )}

      {/* AI Q&A (honest: needs a configured AI provider) */}
      <Card className="p-4">
        <h2 className="font-semibold">❓ Private AI Assistant</h2>
        <p className="mt-1 text-xs text-slate-500">Translate any sentence, or ask about what was said. Free translation works now; open-ended AI Q&amp;A needs a configured AI provider (shown honestly below).</p>
        <AiQna myLang={myLang} theirLang={theirLang} transcriptText={transcript.map((t) => t.original + " " + t.translated).join(" ")} />
      </Card>

      {/* Type-to-translate is defined above; the below is a control hint */}
      {transcript.length > 0 && <div className="text-center text-xs text-slate-400">Tip: switch direction (I speak / They speak) to talk back — NOVA translates both ways.</div>}
    </div>
  );
}

function IntelBox({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      {items.length === 0 ? <div className="mt-1 text-sm text-slate-400">none detected</div> : (
        <ul className="mt-1 space-y-1 text-sm text-slate-700">{items.map((x, i) => <li key={i} className="truncate">• {x}</li>)}</ul>
      )}
    </div>
  );
}

function computeIntel(turns: { dir: string; original: string; translated: string }[]): { prices: string[]; dates: string[]; questions: string[]; commitments: string[]; followUps: string[] } {
  const text = turns.map((t) => t.original + " " + t.translated).join(" . ");
  const prices = Array.from(new Set((text.match(/\$\s?\d[\d,]*(?:\.\d{2})?|\b\d[\d,]*(?:\.\d{2})?\s?(?:usd|dollars?|bucks|tk|taka|million|thousand|lakh)\b|(?:usd|dollars?|bucks|tk|taka)\s?\d[\d,]*(?:\.\d{2})?/gi) || []))).slice(0, 12);
  const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";
  const DATE_RE = new RegExp("\\b(?:\\d{1,2} " + MONTHS + " \\d{0,4}|" + MONTHS + " \\d{1,2}(?:,? ?\\d{4})?|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?)\\b", "gi");
  const dates = Array.from(new Set((text.match(DATE_RE) || []).map((x) => x.replace(/\s+/g, " ").trim()))).slice(0, 12);
  const questions = Array.from(new Set(((text.match(/[^.!?]*\?\s*/g) || []).map((q) => q.trim()).filter((q) => q.length > 3)))).slice(0, 8);
  const sentences = text.replace(/([.!?])\s+/g, "$1\n").split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 3);
  const COMMIT_RE = /\b(commit|commitment|deliver|deliver by|agree|agreed|will send|will do|will provide|will deliver|will pay|will complete|will start|promise|guarantee|confirmed|confirm|contract|sign|payment|invoice|deadline|we will|we are going to)\b/gi;
  const FOLLOWUP_RE = /\b(follow up|follow-up|next step|next steps|next week|by friday|by monday|by tomorrow|by tuesday|by wednesday|by thursday|by end of month|by end of week|remind)\b/gi;
  const commitments: string[] = [];
  const followUps: string[] = [];
  for (const s of sentences) {
    const low = " " + s.toLowerCase().trim() + " ";
    if (COMMIT_RE.test(low) && s.trim().length > 12) commitments.push(s.trim());
    if (FOLLOWUP_RE.test(low) && s.trim().length > 8) followUps.push(s.trim());
  }
  return { prices, dates, questions, commitments: commitments.slice(0, 8), followUps: followUps.slice(0, 8) };
}

function TypeTranslate({ sourceLang, targetLang, onResult }: { sourceLang: string; targetLang: string; onResult: (o: string, t: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const t = await translateServer(sourceLang, targetLang, text.trim());
      onResult(text.trim(), t);
      setText("");
    } catch (e) {
      alert("Translation unavailable right now. Please try again.");
    }
    setBusy(false);
  }
  return (
    <Card className="p-4">
      <h2 className="font-semibold">⌨️ Type to translate (no mic needed)</h2>
      <p className="text-xs text-slate-500">Type in <b>{sourceLang}</b>, get it in <b>{targetLang}</b> + spoken aloud. Great if the mic is blocked.</p>
      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder={"Type in " + sourceLang + "…"} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={go} disabled={busy || !text.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "…" : "Translate + Speak"}</button>
      </div>
    </Card>
  );
}

function AiQna({ myLang, theirLang, transcriptText }: { myLang: string; theirLang: string; transcriptText: string }) {
  const [q, setQ] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask() {
    if (!q.trim()) return;
    setBusy(true);
    // Real: translate the question to the other language (works now, no key).
    try {
      const translated = await translateServer(myLang, theirLang, q.trim());
      setOut("Translation for them: " + translated);
    } catch {
      setOut("Translation service temporarily unavailable.");
    }
    // Business-intel extraction from the transcript (real, deterministic).
    if (/price|cost|price|cost|amount|money|quote|quote|deadline|date|deadline|commit|commitment|follow.?up|question|question|summar/i.test(q)) {
      const intel = computeIntel(transcriptText.split(/(?<=[.!?])\s+/).map((s) => ({ dir: "me", original: s, translated: s })));
      const intelLine = "Detected in the meeting — Prices: " + (intel.prices.join(", ") || "none") + "; Dates: " + (intel.dates.join(", ") || "none") + "; Commitments: " + (intel.commitments.slice(0, 2).join(" | ") || "none") + "; Follow-ups: " + (intel.followUps.slice(0, 2).join(" | ") || "none");
      setOut((o) => o + "\n" + intelLine);
    } else {
      setOut((o) => o + "\n(For open-ended AI answers, configure an AI provider — e.g. add OPENAI_API_KEY in Integrations. Right now I can translate + extract business facts for free.)");
    }
    setBusy(false);
    setQ("");
  }
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder={'Ask (e.g. "what price did they mention?" or "translate: I will send the report tomorrow")'} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={ask} disabled={busy || !q.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "…" : "Ask NOVA"}</button>
      </div>
      {out && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{out}</div>}
    </div>
  );
}
