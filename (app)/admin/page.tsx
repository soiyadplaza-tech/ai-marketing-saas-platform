"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Badge, cx } from "@/lib/ui";

interface AdminData {
  stats: Record<string, number>;
  liveStatus: Record<string, string>;
  users: any[];
  securityEvents: any[];
  errors: any[];
  featureFlags: any[];
}

export default function AdminPage() {
  const [d, setD] = useState<AdminData | null>(null);
  const [tab, setTab] = useState("overview");
  const [userQ, setUserQ] = useState("");
  const [user360, setUser360] = useState<any>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin");
    setD(await r.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  async function load360(id: number) {
    const r = await fetch(`/api/admin?view=user&id=${id}`);
    setUser360(await r.json());
  }

  async function adminAction(id: number, action: string) {
    await fetch("/api/admin", { method: "POST", body: JSON.stringify({ action, id }) });
    if (user360?.user?.id === id) load360(id);
    load();
  }

  if (!d) return <div className="grid min-h-[60vh] place-items-center"><span className="spinner spinner-dark" /></div>;

  const tabs = ["overview", "users", "security", "errors", "flags", "providers"];

  return (
    <div className="mx-auto max-w-7xl space-y-4 animate-fadein">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">👑 Admin / Owner Control Center</h1>
          <p className="text-sm text-slate-500">Full real-time system control. Passwords are stored as secure hashes — admins never see plaintext passwords.</p>
        </div>
        <button onClick={load} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm">↻ Refresh</button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx("px-3 py-2 text-sm font-medium capitalize", tab === t ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800")}>{t}</button>
        ))}
      </div>

      {tab === "overview" && <Overview d={d} />}
      {tab === "users" && <Users d={d} userQ={userQ} setUserQ={setUserQ} on360={load360} onAction={adminAction} user360={user360} close360={() => setUser360(null)} />}
      {tab === "security" && <Security d={d} />}
      {tab === "errors" && <Errors d={d} />}
      {tab === "flags" && <Flags d={d} onReload={load} />}
      {tab === "providers" && <Providers />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg bg-slate-50 p-3"><div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}

function Overview({ d }: { d: AdminData }) {
  const s = d.stats;
  const live = d.liveStatus;
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-3 font-semibold">📊 System Overview (live)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Total Users" value={s.totalUsers} />
          <Stat label="Active Users" value={s.activeUsers} />
          <Stat label="New (30d)" value={s.newUsers30d} />
          <Stat label="Online Sessions" value={s.onlineUsers} />
          <Stat label="Leads" value={s.leads} />
          <Stat label="Qualified Leads" value={s.qualifiedLeads} />
          <Stat label="Meetings Today" value={s.meetingsToday} />
          <Stat label="Live Meetings" value={s.liveMeetings} />
          <Stat label="AI Requests (30d)" value={s.aiRequests30d} />
          <Stat label="Translations (30d)" value={s.translationRequests30d} />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">🟢 Live Service Status (real health checks)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(live).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
              <span className={cx("text-sm font-semibold", v === "operational" ? "text-emerald-600" : v === "connected" ? "text-emerald-600" : "text-amber-600")}>
                {v === "operational" ? "🟢 Operational" : v === "connected" ? "🟢 Connected" : "🟡 " + v.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">⚠️ Open Errors & Security</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-rose-50 p-3"><div className="text-2xl font-bold text-rose-600">{d.errors.length}</div><div className="text-xs text-slate-500">Open errors</div></div>
          <div className="rounded-lg bg-amber-50 p-3"><div className="text-2xl font-bold text-amber-600">{d.securityEvents.filter((e: any) => e.eventType === "failed_login").length}</div><div className="text-xs text-slate-500">Failed logins (24h)</div></div>
        </div>
      </Card>
    </div>
  );
}

function Users({ d, userQ, setUserQ, on360, onAction, user360, close360 }: any) {
  const [confirmReset, setConfirmReset] = useState<number | null>(null);
  const [show360, setShow360] = useState(false);
  const q = userQ.toLowerCase();
  const filtered = (d.users || []).filter((u: any) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));

  return (
    <div className="space-y-4">
          {show360 && user360 && <User360 u={user360.user} security={user360.securityEvents} docs={user360.documents} onAction={onAction} close={() => setShow360(false)} confirmReset={confirmReset} setConfirmReset={setConfirmReset} />}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Users ({filtered.length})</h2>
          <input value={userQ} onChange={(e) => setUserQ(e.target.value)} placeholder="Search name/email…" className="w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-2">User</th><th className="p-2">Role</th><th className="p-2">Password</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="p-2"><div className="font-medium">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                  <td className="p-2"><Badge className="border-slate-200 bg-slate-50 capitalize">{u.role}</Badge></td>
                  <td className="p-2">
                    <button onClick={() => { setConfirmReset(u.id); setShow360(true); }} className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white" title="Admin cannot see the password (secure hash). Click to reset.">
                      🔒 Set
                    </button>
                  </td>
                  <td className="p-2">
                    <button onClick={() => { on360(u.id); setShow360(true); }} className="mr-1 rounded-md border border-slate-300 px-2 py-1 text-xs">360°</button>
                    <button onClick={() => onAction(u.id, u.active ? "disable" : "enable")} className="rounded-md border border-slate-300 px-2 py-1 text-xs">{u.active ? "Disable" : "Enable"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">🔒 Passwords are stored as secure scrypt hashes. Admins can reset (never view) a password.</p>
      </Card>
    </div>
  );
}

function User360({ u, security, docs, onAction, close, confirmReset, setConfirmReset }: any) {
  const [pw, setPw] = useState("");
  async function doReset() {
    if (pw.length < 6) { alert("Password must be 6+ characters."); return; }
    await onAction(u.id, "reset_password");
    setConfirmReset(null); setPw("");
    alert("Password reset sent/issued for this user.");
  }
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4" onClick={close}>
      <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">User 360° — {u.name}</h2>
          <button onClick={close} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Profile</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div><b>Name:</b> {u.name}</div>
              <div><b>Email:</b> {u.email}</div>
              <div><b>Phone:</b> {u.phone || "—"}</div>
              <div><b>Country:</b> {u.country || "—"}</div>
              <div><b>Language:</b> {u.language || "—"}</div>
              <div><b>Company:</b> {u.company || "—"}</div>
              <div><b>Job title:</b> {u.jobTitle || "—"}</div>
              <div><b>Role:</b> {u.role} · <b>Active:</b> {u.active ? "yes" : "no"}</div>
              <div><b>Password:</b> 🔒 {u.passwordStatus === "set" ? "Set (hash — never shown)" : "Not set"}</div>
              <div><b>Last login:</b> {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</div>
            </div>
            <h3 className="mt-4 text-sm font-semibold">Professional Links</h3>
            <div className="mt-1 space-y-1 text-sm">
              <div>Facebook: {u.facebook || "—"}</div>
              <div>LinkedIn: {u.linkedin || "—"}</div>
              <div>Fiverr: {u.fiverrProfile || "—"}</div>
              <div>Upwork: {u.upworkProfile || "—"}</div>
              <div>Website: {u.website || "—"}</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Usage & Activity</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div><b>Active sessions:</b> {u.activeSessions}</div>
              <div><b>Total sessions:</b> {u.sessionsTotal}</div>
              <div><b>Leads (workspace):</b> {u.leadsCount}</div>
              <div><b>Plan:</b> {u.subscription?.plan} ({u.subscription?.status})</div>
            </div>
            <h3 className="mt-4 text-sm font-semibold">Usage by service</h3>
            <div className="mt-1 flex flex-wrap gap-2">
              {(u.usage || []).length === 0 && <span className="text-sm text-slate-400">No usage recorded yet</span>}
              {(u.usage || []).map((u2: any) => <Badge key={u2.service} className="border-slate-200 bg-slate-50 capitalize">{u2.service}: {u2.c}</Badge>)}
            </div>
            <h3 className="mt-4 text-sm font-semibold">Security events</h3>
            <div className="mt-1 max-h-40 space-y-1 overflow-y-auto">
              {(security || []).slice(0, 10).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span>{s.eventType}</span><span className="text-slate-400">{new Date(s.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {(security || []).length === 0 && <span className="text-sm text-slate-400">No security events</span>}
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Documents uploaded</h3>
              <div className="mt-1 max-h-40 overflow-y-auto">
                {(docs || []).length === 0 && <span className="text-sm text-slate-400">No files uploaded</span>}
                {(docs || []).slice(0, 15).map((doc: any) => <div key={doc.id} className="text-xs">📄 {doc.fileName} · {(doc.size || 0).toLocaleString()}B</div>)}
              </div>
            </div>
          </div>
        </div>

        {confirmReset && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm">🔒 Reset password for this user. The current password is a secure hash and is <b>never displayed</b>. Set a new temporary password:</p>
            <div className="mt-2 flex gap-2">
              <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New temporary password" className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
              <button onClick={doReset} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white">Reset</button>
              <button onClick={() => setConfirmReset(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <button onClick={() => onAction(u.id, u.active ? "disable" : "enable")} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">{u.active ? "Disable account" : "Enable account"}</button>
          <button onClick={() => setConfirmReset(u.id)} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-700">Reset password</button>
          <button onClick={() => onAction(u.id, "revoke_sessions")} className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm text-rose-700">Revoke sessions</button>
        </div>
      </div>
    </div>
  );
}

function Security({ d }: { d: AdminData }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">🛡️ Security Center & Audit Log</h2>
      {d.securityEvents.length === 0 && <p className="text-sm text-slate-400">No security events recorded.</p>}
      <div className="space-y-1">
        {d.securityEvents.map((e: any) => (
          <div key={e.id} className="flex items-center justify-between border-b border-slate-100 py-1 text-sm">
            <span>{e.eventType} {e.actorName ? `· ${e.actorName}` : ""} {e.detail ? `· ${e.detail}` : ""}</span>
            <span className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Errors({ d }: { d: AdminData }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">🚨 Error & Incident Center</h2>
      {d.errors.length === 0 && <p className="text-sm text-slate-400">No open errors. System healthy.</p>}
      <div className="space-y-1">
        {d.errors.map((e: any) => (
          <div key={e.id} className="flex items-center justify-between border-b border-slate-100 py-1 text-sm">
            <span><b>{e.service}</b>: {e.message} {e.impact ? `· ${e.impact}` : ""}</span>
            <span className="text-xs text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Flags({ d, onReload }: { d: AdminData; onReload: () => void }) {
  async function toggle(key: string, enabled: boolean) {
    await fetch("/api/admin", { method: "POST", body: JSON.stringify({ action: "feature_flag", key, enabled: !enabled }) });
    onReload();
  }
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">🚩 Feature Flags (Owner control)</h2>
      <div className="space-y-2">
        {d.featureFlags.map((f: any) => (
          <div key={f.key} className="flex items-center justify-between border-b border-slate-100 py-2">
            <div><b>{f.label}</b><div className="text-xs text-slate-400">{f.key} · {f.description}</div></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.enabled} onChange={() => toggle(f.key, f.enabled)} /> {f.enabled ? "Enabled" : "Disabled"}</label>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Providers() {
  const [d, setD] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin").then((r) => r.json()).then((d) => setD({ providers: d.providers }));
  }, []);
  const provs = d?.providers || [];
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">🔌 AI Provider Management (secrets masked)</h2>
      {provs.length === 0 && <p className="text-sm text-slate-400">No AI providers configured. Add a provider to enable LLM-powered AI, translation, speech and TTS.</p>}
      <div className="space-y-2">
        {provs.map((p: any) => (
          <div key={p.key} className="flex items-center justify-between border-b border-slate-100 py-2">
            <div><b>{p.key}</b> · {p.provider} {p.model ? `· ${p.model}` : ""}</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400">{p.maskedKey}</span>
              <Badge className={p.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>{p.enabled ? "Enabled" : "Disabled"}</Badge>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">🔒 Provider keys are stored masked (••••••••). Rotate or replace via your deployment's environment variables.</p>
    </Card>
  );
}
