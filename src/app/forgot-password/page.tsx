"use client";

import { useState } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/services";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ message: string; link?: string } | null>(null);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "forgot", email }) });
    const d = await r.json();
    setBusy(false);
    setDone({ message: d.message, link: d.link });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-6 flex items-center gap-3">
          <img src="/images/logo.png" alt="FOYSAL IT" className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200" />
          <div>
            <div className="text-lg font-extrabold text-slate-900">{COMPANY.name}</div>
            <div className="text-xs text-slate-400">Password recovery</div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your account email and we will send a one-time reset link (valid 1 hour).</p>

        {done ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{done.message}</div>
            {done.link && (
              <a href={done.link} className="block break-all rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                🔑 Open reset link
              </a>
            )}
            <Link href="/login" className="inline-block text-sm font-semibold text-fuchsia-600 hover:underline">← Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" />
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-200 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-60">
              {busy ? "Sending…" : "Send Reset Link"}
            </button>
            <Link href="/login" className="block text-center text-sm font-semibold text-fuchsia-600 hover:underline">← Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
}
