"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true); setError("");
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "reset", token, password }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error || "Reset failed");
    setDone(true);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
      <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a strong password for your FOYSAL IT account.</p>

      {done ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✅ Password updated successfully.</div>
          <Link href="/login" className="inline-block text-sm font-semibold text-fuchsia-600 hover:underline">Go to Sign In →</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100" />
          </div>
          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-200 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-60">
            {busy ? "Saving…" : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
