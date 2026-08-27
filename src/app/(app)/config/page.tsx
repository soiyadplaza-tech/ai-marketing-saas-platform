"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge } from "@/lib/ui";

export default function ConfigPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/config/status").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">A‑Z Configuration</h1>
          <p className="text-sm text-slate-500">See exactly what is configured and what is missing — the whole platform, in one place.</p>
        </div>
        <Badge className={data.totalSet === data.totalItems ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
          {data.totalSet}/{data.totalItems} settings present
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Mail sender (primary)</div>
          <div className="text-lg font-bold">{data.mailPrimary === "smtp" ? "Gmail SMTP" : data.mailPrimary === "resend" ? "Resend" : data.mailPrimary === "sendgrid" ? "SendGrid" : "none"}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Active AI</div>
          <div className="text-lg font-bold">{data.activeLlm}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Deployment</div>
          <div className="text-lg font-bold">{data.groups[5]?.items[1]?.note || "—"}</div>
        </Card>
      </div>

      {/* How mail sends — the explainer */}
      <Card className="p-5">
        <h2 className="font-semibold">📧 How an email actually gets sent (API key vs app password)</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          <div className="rounded-lg bg-slate-50 p-3">
            <b>1. Primary — Gmail (app password, NOT an API key).</b>
            <br />A <b>Google App Password</b> is a 16-character code (format: <code>xxxx xxxx xxxx xxxx</code>) you create at <code>myaccount.google.com/apppasswords</code> — only if 2-Step Verification is on. It is a <b>password</b>, not an API key. The app uses it (set securely as the <code>GMAIL_APP_PASSWORD</code> environment variable, never in code) to log into your Gmail over SMTP (smtp.gmail.com:587) and sends as <code>foysalahmed.dm23@gmail.com</code>.
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <b>2. Backup #1 — Resend (this IS an API key).</b>
            If Gmail fails, the app automatically retries through Resend using <code>RESEND_API_KEY</code> (an API key, starts with <code>re_</code>). To send <i>from</i> your own domain on Resend you verify foysalit.com DNS once; until then it sends from the Resend account.
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <b>3. Backup #2 — SendGrid (API key).</b> Another fallback using <code>SENDGRID_API_KEY</code>.
          </div>
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-800">
            So: <b>app password = Gmail login</b>; <b>API key = Resend/SendGrid/AI providers</b>. They are different things. The pilot tries Gmail → Resend → SendGrid in order and shows the <b>real</b> result of whichever one worked. Nothing is faked.
          </div>
        </div>
      </Card>

      {/* Groups */}
      {data.groups.map((g: any) => (
        <Card key={g.group} className="p-4">
          <h3 className="font-semibold">{g.group}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {g.items.map((it: any) => (
              <div key={it.key} className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 p-2">
                <div>
                  <div className="text-sm font-medium">{it.label}</div>
                  <div className="text-[11px] text-slate-400">
                    <code className="font-mono">{it.key}</code>
                    {it.note ? ` · ${it.note}` : ""}
                  </div>
                </div>
                <Badge className={it.set ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600"}>
                  {it.set ? "🟢 set" : "🔴 missing"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/ai-settings" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-indigo-300">🧠 AI Providers →</Link>
        <Link href="/database" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-indigo-300">🗄️ Database health →</Link>
        <Link href="/integrations" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold hover:border-indigo-300">🔌 Integrations →</Link>
      </div>
    </div>
  );
}
