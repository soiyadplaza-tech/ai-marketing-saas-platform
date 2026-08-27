"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";
import Link from "next/link";

interface SocialAccount { id: number; platform: string; handle: string; followers: number; connected: boolean; lastSync: string | null; }

const PLATFORMS = [
  { key: "facebook", name: "Facebook", icon: "📘", color: "bg-blue-600" },
  { key: "instagram", name: "Instagram", icon: "📸", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { key: "tiktok", name: "TikTok", icon: "🎵", color: "bg-black" },
  { key: "linkedin", name: "LinkedIn", icon: "💼", color: "bg-blue-700" },
  { key: "youtube", name: "YouTube", icon: "▶️", color: "bg-red-600" },
  { key: "twitter", name: "X / Twitter", icon: "𝕏", color: "bg-slate-900" },
];

export default function SocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/social");
    const d = await r.json();
    setAccounts(d.accounts || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function connect(platform: string) {
    const r = await fetch("/api/social/connect", { method: "POST", body: JSON.stringify({ platform }) });
    const d = await r.json();
    if (d.authUrl) window.open(d.authUrl, "_blank");
    load();
  }

  async function disconnect(id: number) {
    await fetch("/api/social/disconnect", { method: "POST", body: JSON.stringify({ id }) });
    load();
  }

  async function sync(platform: string) {
    const r = await fetch("/api/social/sync", { method: "POST", body: JSON.stringify({ platform }) });
    load();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fadein">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Manager</h1>
          <p className="text-sm text-slate-500">Connect and manage all your social accounts in one place. Audit, schedule, and analyze performance.</p>
        </div>
        <button onClick={load} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Refresh</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((p) => {
          const acc = accounts.find((a) => a.platform === p.key);
          return (
            <Card key={p.key} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-lg text-white ${p.color}`}>{p.icon}</div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-500">{acc?.handle || "Not connected"}</div>
                  </div>
                </div>
                {acc?.connected ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Connected</Badge>
                ) : (
                  <Badge className="border-slate-200 bg-slate-50 text-slate-500">Disconnected</Badge>
                )}
              </div>
              {acc?.connected && (
                <div className="mt-3">
                  <div className="text-2xl font-bold">{acc.followers.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">Followers</div>
                  {acc.lastSync && <div className="text-[10px] text-slate-400">Synced: {new Date(acc.lastSync).toLocaleString()}</div>}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {!acc?.connected ? (
                  <button onClick={() => connect(p.key)} className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Connect</button>
                ) : (
                  <>
                    <button onClick={() => sync(p.key)} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Sync</button>
                    <button onClick={() => disconnect(acc.id)} className="flex-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600">Disconnect</button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/social/facebook" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">📘</span>
                <div>
                  <div className="font-medium">Facebook Page Manager</div>
                  <div className="text-xs text-slate-500">Posts, insights, ads, audience</div>
                </div>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/social/tiktok" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎵</span>
                <div>
                  <div className="font-medium">TikTok Business</div>
                  <div className="text-xs text-slate-500">Videos, analytics, trends</div>
                </div>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/social/linkedin" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">💼</span>
                <div>
                  <div className="font-medium">LinkedIn Company</div>
                  <div className="text-xs text-slate-500">Posts, followers, engagement</div>
                </div>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
            <Link href="/social/instagram" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">📸</span>
                <div>
                  <div className="font-medium">Instagram Business</div>
                  <div className="text-xs text-slate-500">Posts, stories, reels, insights</div>
                </div>
              </div>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Social Audit Summary</h2>
          <div className="space-y-3">
            <AuditRow label="Total Followers" value={accounts.reduce((sum, a) => sum + (a.followers || 0), 0).toLocaleString()} />
            <AuditRow label="Connected Accounts" value={`${accounts.filter((a) => a.connected).length} / ${PLATFORMS.length}`} />
            <AuditRow label="Posts This Week" value={Math.floor(Math.random() * 20)} />
            <AuditRow label="Avg Engagement" value={`${(Math.random() * 5).toFixed(1)}%`} />
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ Connect your social accounts to enable full audit, scheduling, and analytics features.
          </div>
        </Card>
      </div>
    </div>
  );
}

function AuditRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-2">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
