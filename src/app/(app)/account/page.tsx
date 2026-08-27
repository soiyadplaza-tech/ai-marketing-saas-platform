"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/lib/ui";
import { COMPANY } from "@/lib/services";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [fiverr, setFiverr] = useState("");
  const [upwork, setUpwork] = useState("");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function load() {
    const r = await fetch("/api/auth");
    if (r.status === 401) { router.replace("/login"); return; }
    const d = await r.json();
    setUser(d.user);
    setFiverr(d.user.fiverrProfile || "");
    setUpwork(d.user.upworkProfile || "");
  }
  useEffect(() => { load(); }, []);

  async function changePassword(e: { preventDefault: () => void }) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "change", current: cur, next }) });
    const d = await r.json();
    setMsg(d.message || d.error);
    if (r.ok) { setCur(""); setNext(""); }
  }

  async function saveProfiles(e: { preventDefault: () => void }) {
    e.preventDefault();
    await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "profiles", fiverr, upwork }) });
    setMsg("Freelance profiles saved.");
  }

  async function logout() {
    await fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    router.replace("/login");
  }

  if (!user) return <div className="grid min-h-[50vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 animate-fadein">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Details</h1>
          <p className="text-sm text-slate-500">Your profile, security and marketplace links.</p>
        </div>
        <button onClick={logout} className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">Sign Out</button>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-yellow-400 text-xl font-black text-white">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="text-lg font-bold">{user.name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 capitalize">{user.role?.replace("_", " ")}</Badge>
              <span className="text-xs text-slate-400">Member since {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Change Password</h2>
          <form onSubmit={changePassword} className="mt-3 space-y-3">
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="Current password" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (min 6)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Update Password</button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Freelance Profiles</h2>
          <form onSubmit={saveProfiles} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fiverr profile</label>
              <input value={fiverr} onChange={(e) => setFiverr(e.target.value)} placeholder="https://www.fiverr.com/foysal" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upwork profile</label>
              <input value={upwork} onChange={(e) => setUpwork(e.target.value)} placeholder="https://www.upwork.com/freelancers/foysal" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Save Profiles</button>
            <p className="text-[11px] text-slate-400">Shown on outreach signatures so clients can verify you on Fiverr / Upwork.</p>
          </form>
        </Card>
      </div>

      {msg && <Card className={`p-3 text-sm ${msg.includes("saved") || msg.includes("updated") || msg.includes("changed") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{msg}</Card>}

      <Card className="p-5">
        <h2 className="font-semibold">FOYSAL IT — Call To Action</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-400">Call</span><div className="font-medium">{COMPANY.call}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-400">WhatsApp</span><div className="font-medium">{COMPANY.whatsapp}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-400">Email</span><div className="font-medium break-all">{COMPANY.email}</div></div>
          <div className="rounded-lg bg-slate-50 p-3"><span className="text-xs text-slate-400">Website</span><div className="font-medium break-all">{COMPANY.website}</div></div>
        </div>
      </Card>
    </div>
  );
}
