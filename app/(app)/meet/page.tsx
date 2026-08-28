"use client";

// Real-time voice translation for meetings.
// You speak in Bangla → the other person hears/sees their language (and vice-versa).
// Uses the browser's SpeechRecognition (STT) + free MyMemory translation + SpeechSynthesis (TTS).
// No API key needed. Works best in Chrome / Edge.

import { useEffect, useRef, useState } from "react";

const LANGS = [
  { code: "bn-BD", label: "Bangla (বাংলা)", short: "bn" },
  { code: "en-US", label: "English", short: "en" },
  { code: "ja-JP", label: "Japanese (日本語)", short: "ja" },
  { code: "zh-CN", label: "Chinese (中文)", short: "zh-CN" },
  { code: "hi-IN", label: "Hindi (हिन्दी)", short: "hi" },
  { code: "ar-SA", label: "Arabic (العربية)", short: "ar" },
  { code: "ko-KR", label: "Korean (한국어)", short: "ko" },
  { code: "es-ES", label: "Spanish (Español)", short: "es" },
  { code: "fr-FR", label: "French (Français)", short: "fr" },
  { code: "de-DE", label: "German (Deutsch)", short: "de" },
];

const shortCode = (code: string) => (code === "bn-BD" ? "bn" : code.split("-")[0]);

async function translate(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${shortCode(from)}|${shortCode(to)}`;
    const r = await fetch(url);
    const d = await r.json();
    const t = d?.responseData?.translatedText;
    if (t && !/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(t)) return decodeHtml(t);
    return "";
  } catch {
    return "";
  }
}

function decodeHtml(s: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

export default function MeetPage() {
  const [myLang, setMyLang] = useState("bn-BD"); // I speak this
  const [theirLang, setTheirLang] = useState("en-US"); // they speak this
  const [direction, setDirection] = useState<"me" | "them">("me"); // "me" = I speak, they understand
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean>(true);
  const [interim, setInterim] = useState("");
  const [original, setOriginal] = useState(""); // last final heard text
  const [translated, setTranslated] = useState(""); // last translated text
  const [history, setHistory] = useState<{ from: string; to: string; dir: "me" | "them" }[]>([]);
  const [ttsOn, setTtsOn] = useState(true);
  const [manualText, setManualText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");

  const recRef = useRef<any>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
    return () => { try { recRef.current?.stop(); } catch {} };
  }, []);

  const srcLang = direction === "me" ? myLang : theirLang; // language being spoken into mic
  const dstLang = direction === "me" ? theirLang : myLang; // language we output

  async function handleFinal(text: string) {
    if (!text.trim() || busyRef.current) return;
    busyRef.current = true;
    setOriginal(text);
    setInterim("");
    setTranslating(true);
    const out = await translate(text, srcLang, dstLang);
    setTranslated(out || "(translation unavailable)");
    setTranslating(false);
    busyRef.current = false;
    setHistory((h) => [{ from: text, to: out || "", dir: direction }, ...h].slice(0, 50));
    if (ttsOn && out) speak(out, dstLang);
  }

  function start() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Your browser doesn't support speech recognition. Use Chrome or Edge."); return; }
    setError("");
    const rec = new SR();
    rec.lang = srcLang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          handleFinal(e.results[i][0].transcript);
        } else {
          interimText += e.results[i][0].transcript;
        }
      }
      setInterim(interimText);
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") setError("Microphone blocked. Allow mic access and try again.");
      else if (e.error !== "no-speech" && e.error !== "aborted") setError("Mic error: " + e.error);
    };
    rec.onend = () => {
      // auto-restart for continuous listening
      if (listening) { try { rec.start(); } catch {} }
    };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch (e: any) { setError("Could not start mic: " + e?.message); }
  }

  function stop() {
    setListening(false);
    try { recRef.current?.stop(); } catch {}
  }

  function speak(text: string, lang: string) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(shortCode(lang)));
      if (v) u.voice = v;
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  }

  async function translateManual() {
    if (!manualText.trim()) return;
    setTranslating(true);
    const out = await translate(manualText, srcLang, dstLang);
    setTranslated(out || "(translation unavailable)");
    setHistory((h) => [{ from: manualText, to: out || "", dir: direction }, ...h].slice(0, 50));
    if (ttsOn && out) speak(out, dstLang);
    setTranslating(false);
    setManualText("");
  }

  const iAmSpeaking = direction === "me";
  const speakLabel = iAmSpeaking ? "আপনি কথা বলছেন (বাংলা)" : "ওরা কথা বলছে";
  const outLabel = iAmSpeaking ? "→ ওরা শুনবে (English)" : "→ আপনি শুনবেন (বাংলা)";

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">🎙️ Meeting Translator</h1>
        <p className="text-sm text-slate-500">
          আপনি বাংলায় কথা বলুন — ওরা আপনার ভাষায় শুনবে/পাবে। বা ওরা কথা বললে আপনি বাংলায় শুনবেন। Real-time voice translation (works in Chrome/Edge).
        </p>
      </div>

      {!supported && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Your browser doesn't support live speech recognition. Please use <b>Chrome</b> or <b>Edge</b> on desktop. You can still use the <b>type-to-translate</b> box below.
        </div>
      )}

      {/* Controls */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2a0a3a] to-[#4a0d67] p-5 text-white">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-fuchsia-200">আপনার ভাষা (You speak)</label>
            <select value={myLang} onChange={(e) => setMyLang(e.target.value)} className="mt-1 w-full rounded-lg bg-white/95 px-3 py-2 text-sm text-slate-800">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-fuchsia-200">ওর ভাষা (They speak)</label>
            <select value={theirLang} onChange={(e) => setTheirLang(e.target.value)} className="mt-1 w-full rounded-lg bg-white/95 px-3 py-2 text-sm text-slate-800">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => { setDirection("me"); }} className={`rounded-xl px-3 py-3 text-sm font-semibold ${direction === "me" ? "bg-white text-purple-700" : "bg-white/15 text-white"}`}>
            🗣️ আমি বলছি<br /><span className="text-xs font-normal">(I speak → they hear)</span>
          </button>
          <button onClick={() => { setDirection("them"); }} className={`rounded-xl px-3 py-3 text-sm font-semibold ${direction === "them" ? "bg-white text-purple-700" : "bg-white/15 text-white"}`}>
            👂 ওরা বলছে<br /><span className="text-xs font-normal">(They speak → I hear)</span>
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center">
          <button
            onClick={listening ? stop : start}
            disabled={!supported}
            className={`grid h-20 w-20 place-items-center rounded-full text-3xl shadow-xl transition ${listening ? "bg-rose-500 animate-pulse" : "bg-white text-rose-600"} disabled:opacity-40`}
          >
            {listening ? "⏹" : "🎤"}
          </button>
        </div>
        <div className="mt-2 text-center text-sm">
          {listening ? <span className="text-rose-200">🔴 Listening… {speakLabel}</span> : <span className="text-fuchsia-200">Tap the mic to start</span>}
        </div>
        <label className="mt-3 flex items-center justify-center gap-2 text-sm text-fuchsia-100">
          <input type="checkbox" checked={ttsOn} onChange={(e) => setTtsOn(e.target.checked)} />
          Speak the translation aloud (🔊)
        </label>
        {error && <div className="mt-3 rounded-lg bg-rose-500/30 p-2 text-center text-sm text-rose-100">{error}</div>}
      </div>

      {/* Live caption */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live caption</div>
        <div className="mt-2 min-h-[3rem]">
          <div className="text-lg text-slate-500">{interim || original || <span className="text-slate-300">—</span>}</div>
        </div>
        <div className="my-3 text-center text-slate-300">↓ {outLabel} ↓</div>
        <div className="min-h-[3rem] rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 p-3">
          <div className="text-2xl font-semibold text-purple-800">{translating ? "…" : translated || <span className="text-purple-200">Translation will appear here</span>}</div>
        </div>
        {translated && (
          <button onClick={() => speak(translated, dstLang)} className="mt-3 rounded-lg border border-slate-300 px-4 py-1.5 text-sm">🔊 Replay</button>
        )}
      </div>

      {/* Type to translate fallback */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">No mic? Type to translate ({speakLabel})</div>
        <div className="mt-2 flex gap-2">
          <input
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && translateManual()}
            placeholder="Type here to translate…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button onClick={translateManual} disabled={translating} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {translating ? "…" : "Translate"}
          </button>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Conversation ({history.length})</div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-400">{h.dir === "me" ? "You said" : "They said"}</div>
                <div className="text-sm text-slate-700">{h.from}</div>
                <div className="mt-1 border-t border-slate-200 pt-1 text-sm font-medium text-purple-700">→ {h.to}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-slate-100 p-4 text-xs text-slate-500">
        <b>How to use in a meeting:</b> When <b>you</b> speak, select "আমি বলছি" and speak naturally in Bangla — the other person sees/hears English. When <b>they</b> speak, switch to "ওরা বলছে" — you'll see/hear Bangla. Keep the tab focused and mic permission on. Best in Chrome/Edge.
      </div>
    </div>
  );
}
