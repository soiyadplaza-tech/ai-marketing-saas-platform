"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

interface Step { id: number; dayOffset: number; subject: string | null; body: string | null; }
interface Campaign { id: number; name: string; channel: string; status: string; dailyLimit: number; leadCount: number; sentCount: number; repliedCount: number; steps: Step[]; }

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("email");

  async function load() {
    const r = await fetch("/api/campaigns");
    const d = await r.json();
    setCampaigns(d.campaigns || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return;
    await fetch("/api/campaigns", { method: "POST", body: JSON.stringify({ name, channel }) });
    setName(""); setShowNew(false); load();
  }

  async function setStatus(id: number, status: string) {
    await fetch("/api/campaigns", { method: "PATCH", body: JSON.stringify({ id, status }) });
    load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-slate-500">Multi-step outreach sequences with human-in-the-loop control.</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">+ New Campaign</button>
      </div>

      {showNew && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <button onClick={create} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Create</button>
          </div>
          <p className="mt-2 text-xs text-slate-400">A default 5-step sequence (Day 1, 3, 6, 10, 15) is created automatically.</p>
        </Card>
      )}

      {campaigns.length === 0 && <Card className="p-10 text-center text-slate-400">No campaigns yet.</Card>}

      {campaigns.map((c) => (
        <Card key={c.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-xs text-slate-500">{c.channel === "whatsapp" ? "💬 WhatsApp" : "✉️ Email"} · {c.leadCount} leads · limit {c.dailyLimit}/day</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={c.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : c.status === "paused" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{c.status}</Badge>
              {c.status !== "active" && <button onClick={() => setStatus(c.id, "active")} className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">Activate</button>}
              {c.status === "active" && <button onClick={() => setStatus(c.id, "paused")} className="rounded-md border border-slate-300 px-3 py-1 text-xs">Pause</button>}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.steps.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                <div className="font-semibold text-indigo-600">Day {s.dayOffset}</div>
                <div className="text-slate-600">{s.subject}</div>
              </div>
            ))}
          </div>
          {c.status === "active" && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
              Sending is queued but held until an Email/WhatsApp provider is connected in Integrations.
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
