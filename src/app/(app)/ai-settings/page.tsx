"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

interface Provider { key: string; name: string; icon: string; env: string; configured: boolean; kind: "cloud" | "local"; api: string; }

export default function AISettingsPage() {
  const [data, setData] = useState<any>(null);
  const [activeLlm, setActiveLlm] = useState<string>("");

  useEffect(() => {
    fetch("/api/ai/providers").then((r) => r.json()).then((d) => {
      setData(d);
      fetch("/api/ai/active").then((r) => r.json()).then((a) => setActiveLlm(a.active || ""));
    });
  }, []);

  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  const cloud = data.providers.filter((p: Provider) => p.kind === "cloud");
  const local = data.providers.filter((p: Provider) => p.kind === "local");

  const statusFor = (p: Provider, active: string) =>
    p.configured ? (p.key === active ? "🟢 Active" : "🟢 Configured") : p.kind === "local" ? " Not set" : " Needs key";

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Providers</h1>
          <p className="text-sm text-slate-500">
            {activeLlm ? <>Active LLM: <b>{activeLlm}</b></> : "No LLM key set — using built-in engines (real, no key needed). Add any key below to unlock LLM-powered answers."}
          </p>
        </div>
        <Badge className={data.totalConfigured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
          {data.totalConfigured} configured
        </Badge>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold">Cloud Providers</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cloud.map((p: Provider) => (
            <div key={p.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold"><span>{p.icon}</span>{p.name}</div>
                <span className="text-xs font-medium">{statusFor(p, activeLlm)}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Env: <code className="font-mono">{p.env}</code></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">Local / OpenAI-compatible</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {local.map((p: Provider) => (
            <div key={p.key} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold"><span>{p.icon}</span>{p.name}</div>
                <span className="text-xs font-medium">{statusFor(p, activeLlm)}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Env: <code className="font-mono">{p.env}</code></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold">How to enable a provider</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Get an API key from the provider (e.g. OpenAI, Groq, Gemini, DeepSeek).</li>
          <li>Add it as a server environment variable (Vercel → Environment Variables) using the exact name shown above. Never put keys in the browser.</li>
          <li>Reload this page — the indicator turns 🟢. The AI assistant, Copilot and Gmail AI will now use that LLM automatically (labeled honestly in every response).</li>
        </ol>
        <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
          💡 Without any key, the app still works with <b>real built-in engines</b> — extractive summarization, context-based reply writing, real MyMemory translation, and script-based language detection. Nothing is faked either way.
        </div>
      </Card>
    </div>
  );
}
