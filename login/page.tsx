"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COMPANY, SERVICE_LIST } from "@/lib/services";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function doLogin(e?: { preventDefault: () => void }, em?: string, pw?: string) {
    e?.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "login", email: em || email, password: pw || password }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error || "Login failed");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#1c0526] p-12 lg:flex">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 20% 20%, #7c3aed 0%, transparent 45%), radial-gradient(circle at 80% 70%, #eab308 0%, transparent 40%)" }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="FOYSAL IT" className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/20" />
            <div>
              <div className="text-xl font-extrabold tracking-wide text-white">{COMPANY.name}</div>
              <div className="text-xs text-fuchsia-200/70">{COMPANY.tagline}</div>
            </div>
          </Link>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            AI-Powered Lead Intelligence<br />& Sales Management
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-fuchsia-100/70">
            Import leads → AI website audit → opportunity detection → lead scoring → personalized outreach → pipeline → revenue. All in one professional workspace.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-2 gap-2">
            {SERVICE_LIST.slice(0, 8).map((s) => (
              <div key={s.key} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-fuchsia-100/80">{s.name}</div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-fuchsia-200/50">
          ✆ {COMPANY.call} · {COMPANY.whatsapp} · {COMPANY.email}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-yellow-400 text-lg font-black text-white">FT</div>
              <div className="text-lg font-extrabold text-slate-900">{COMPANY.name}</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your FOYSAL IT workspace.</p>

          <form onSubmit={doLogin} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-fuchsia-600 hover:underline">Forgot password?</Link>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" />
            </div>
            {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-200 transition hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-60">
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button onClick={() => doLogin(undefined, "admin@foysalit.com", "foysal@2026")} disabled={busy} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            🚀 One-click Owner Login
          </button>
          <p className="mt-1 text-center text-[11px] text-slate-400">Owner admin: foysalimran890098@gmail.com</p>

          <p className="mt-5 text-center text-sm text-slate-500">
            New member? <Link href="/register" className="font-semibold text-fuchsia-600 hover:underline">Create your free account</Link> — each member gets their own workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
