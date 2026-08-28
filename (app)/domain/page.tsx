"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

export default function DomainPage() {
  const [data, setData] = useState<any>(null);
  const [mailMsg, setMailMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [testTo, setTestTo] = useState("foysalahmed.dm23@gmail.com");

  async function load() {
    const [d, p] = await Promise.all([
      fetch("/api/domain/status").then((r) => r.json()).catch(() => null),
      fetch("/api/permanent-domain").then((r) => r.json()).catch(() => null),
    ]);
    setData({ domain: d, permanent: p });
  }
  useEffect(() => { load(); }, []);

  async function sendTest() {
    setBusy(true); setMailMsg("Sending real test email…");
    const r = await fetch("/api/integrations", { method: "PATCH", body: JSON.stringify({ provider: "email", action: "smtp_test", to: testTo }) });
    const d = await r.json();
    setBusy(false);
    setMailMsg(d.message || d.error || "Test completed.");
    load();
  }

  if (!data) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  const netlifyOk = data.permanent?.netlify?.health?.ok;
  const customOk = data.permanent?.customDomain?.health?.ok;
  const mailReady = data.domain?.mailRobot?.ready;

  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Domain & Deployment</h1>
        <p className="text-sm text-slate-500">Permanent Netlify deployment + custom domain + mail robot status.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Status title="Netlify project" ok={!!netlifyOk} detail="foysalit-app.netlify.app" />
        <Status title="Custom domain" ok={!!customOk} detail="foysalit.publicvm.com" />
        <Status title="Mail robot" ok={!!mailReady} detail={data.domain?.mailRobot?.primary || "not configured"} />
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">1) Permanent URL that works now</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <UrlBox label="Netlify permanent URL" value="https://foysalit-app.netlify.app" ok={netlifyOk} />
          <UrlBox label="Custom permanent domain" value="https://foysalit.publicvm.com" ok={customOk} />
        </div>
        <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          Use <b>https://foysalit-app.netlify.app</b> right now — it is permanent on Netlify. To make <b>foysalit.publicvm.com</b> also open the same app, add it in Netlify → Domain management first, then set the DNS records Netlify gives you.
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">2) Connect foysalit.publicvm.com to Netlify</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Open Netlify → Site <b>foysalit-app</b> → <b>Domain management</b>.</li>
          <li>Click <b>Add custom domain</b> → enter <code className="font-mono">foysalit.publicvm.com</code>.</li>
          <li>Netlify will show the exact DNS records. Copy those values.</li>
          <li>Open DNSExit / PublicVM DNS panel → update <b>A/CNAME</b> records to the Netlify values.</li>
          <li>Enable Netlify HTTPS/SSL. Wait 5–30 minutes for DNS propagation.</li>
        </ol>
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          Current DNS screenshot shows <code>foysalit.publicvm.com → 162.120.184.227</code>. That is not confirmed as Netlify. For Netlify custom domain, always use the DNS values Netlify gives in Domain management.
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">3) Netlify environment variables</h2>
        <p className="mt-1 text-sm text-slate-500">Set these in Netlify → Site settings → Environment variables. Do not put secrets in code.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            ["APP_BASE_URL", "https://foysalit.publicvm.com"],
            ["NEXT_PUBLIC_SITE_URL", "https://foysalit.publicvm.com"],
            ["CUSTOM_DOMAIN", "foysalit.publicvm.com"],
            ["APP_DATABASE_URL", "your Neon/Postgres URL"],
            ["GMAIL_USER", "foysalahmed.dm23@gmail.com"],
            ["GMAIL_APP_PASSWORD", "16-char Google app password"],
            ["GOOGLE_REDIRECT_URI", "https://foysalit.publicvm.com/api/gmail/callback"],
            ["GOOGLE_CLIENT_ID / SECRET", "Google OAuth credentials"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-slate-50 p-3 text-xs">
              <div className="font-mono font-semibold text-slate-700">{k}</div>
              <div className="mt-1 break-all text-slate-500">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">4) Google OAuth Redirect URI</h2>
        <p className="mt-1 text-sm text-slate-500">In Google Cloud → OAuth Client → Authorized redirect URIs, add:</p>
        <code className="mt-2 block rounded-lg bg-slate-900 p-3 text-xs text-emerald-300">https://foysalit.publicvm.com/api/gmail/callback</code>
        <p className="mt-2 text-xs text-slate-500">The old <code>urn:ietf:wg:oauth:2.0:oob</code> is for command-line apps. The web app needs the callback URL above.</p>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">5) Mail Robot Test</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} className="min-w-72 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={sendTest} disabled={busy} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send real test email"}</button>
        </div>
        {mailMsg && <div className={"mt-3 rounded-lg p-3 text-sm " + (mailMsg.includes("delivered") ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700")}>{mailMsg}</div>}
      </Card>
    </div>
  );
}

function Status({ title, ok, detail }: { title: string; ok: boolean; detail: string }) {
  return <Card className="p-4"><div className="flex items-center justify-between"><div><div className="font-semibold">{title}</div><div className="text-xs text-slate-500">{detail}</div></div><Badge className={ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{ok ? "OK" : "Setup"}</Badge></div></Card>;
}

function UrlBox({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">{value}</div><div className={"mt-1 text-xs " + (ok ? "text-emerald-600" : "text-amber-600")}>{ok ? "Live" : "Not connected yet"}</div></div>;
}
