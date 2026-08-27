"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/lib/ui";

const PLANS = [
  { key: "free", name: "Free Trial", price: "৳0", limits: ["Lead import preview", "NOVA AI translator", "Basic CRM", "Limited reports"] },
  { key: "starter", name: "Starter", price: "Configurable", limits: ["Lead management", "Website audits", "Email drafts", "1 workspace"] },
  { key: "professional", name: "Professional", price: "Configurable", limits: ["Daily outreach", "Reports", "Team roles", "AI Copilot"] },
  { key: "agency", name: "Agency", price: "Configurable", limits: ["Client portals", "Automation", "Multi-team", "Advanced analytics"] },
  { key: "enterprise", name: "Enterprise", price: "Custom", limits: ["Custom domain", "Provider governance", "Security center", "Priority setup"] },
];

export default function SubscriptionPage() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => setMe(d.user || null)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-sm text-slate-500">Plans are configurable. Payment provider integration is prepared but not connected yet.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-semibold">Current account</div>
            <div className="text-sm text-slate-500">{me?.email || "Loading…"}</div>
          </div>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Free / Active</Badge>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PLANS.map((p) => (
          <Card key={p.key} className="p-4">
            <div className="text-lg font-bold">{p.name}</div>
            <div className="mt-1 text-sm text-indigo-600">{p.price}</div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {p.limits.map((x) => <li key={x}>✓ {x}</li>)}
            </ul>
            <button disabled className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-400">
              Payment provider not connected
            </button>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe/payment provider is not connected yet, so the app does not charge anyone or show fake payment success. Admin can configure plans and connect payment later.
      </Card>
    </div>
  );
}
