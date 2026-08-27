"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COMPANY } from "@/lib/services";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "sales", company: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "register", ...form }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error || "Registration failed");
    router.push("/dashboard");
    router.refresh();
  }

  const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link href="/" className="mb-6 flex items-center gap-3">
          <img src="/images/logo.png" alt="FOYSAL IT" className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200" />
          <div>
            <div className="text-lg font-extrabold text-slate-900">{COMPANY.name}</div>
            <div className="text-xs text-slate-400">{COMPANY.tagline}</div>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Join the FOYSAL IT team workspace.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className={field} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" className={field} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className={field} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company (optional)</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your business name" className={field} />
          </div>
          <p className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
            You'll get a free <b>member</b> account with your own private workspace. The owner's account has full admin access automatically.
          </p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company (optional)</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="FOYSAL IT" className={field} />
          </div>
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-200 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-60">
            {busy ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link href="/login" className="font-semibold text-fuchsia-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
