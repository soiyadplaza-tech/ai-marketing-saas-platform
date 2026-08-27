"use client";

import { useState } from "react";
import { Card, Badge } from "@/lib/ui";
import Link from "next/link";

export default function FacebookPage() {
  const [tab, setTab] = useState("overview");
  const [connected, setConnected] = useState(false);

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "posts", label: "Posts", icon: "📝" },
    { key: "insights", label: "Insights", icon: "📈" },
    { key: "ads", label: "Ads Manager", icon: "🎯" },
    { key: "audience", label: "Audience", icon: "👥" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  if (!connected) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 animate-fadein">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-slate-400 hover:text-slate-600">← Back</Link>
          <h1 className="text-2xl font-bold">Facebook Page Manager</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">📘</div>
          <h2 className="text-xl font-semibold mb-2">Connect Your Facebook Page</h2>
          <p className="text-sm text-slate-500 mb-4">Manage posts, insights, ads, and audience from one dashboard.</p>
          <button onClick={() => setConnected(true)} className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500">
            Connect Facebook Account
          </button>
          <p className="mt-4 text-xs text-slate-400">Requires Facebook Business Manager access</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 animate-fadein">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-slate-400 hover:text-slate-600">← Back</Link>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📘</span>
            <div>
              <h1 className="text-xl font-bold">FOYSAL IT</h1>
              <p className="text-xs text-slate-500">Facebook Business Page</p>
            </div>
          </div>
        </div>
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Connected</Badge>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium ${tab === t.key ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Page Likes" value="12,458" change="+2.3%" />
            <MetricCard label="Followers" value="13,201" change="+1.8%" />
            <MetricCard label="Post Reach" value="45,892" change="+5.1%" />
            <MetricCard label="Engagement" value="3,421" change="+0.9%" />
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Recent Posts</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div>
                    <div className="font-medium text-sm">SEO Tips for Local Businesses - Part {i}</div>
                    <div className="text-xs text-slate-500">Posted {i} day{i > 1 ? "s" : ""} ago</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>👍 {Math.floor(Math.random() * 200)}</span>
                    <span>💬 {Math.floor(Math.random() * 50)}</span>
                    <span>↗️ {Math.floor(Math.random() * 100)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Create New Post</h3>
            <textarea className="w-full rounded-lg border border-slate-300 p-3 text-sm" rows={4} placeholder="What's on your mind?" />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">📷 Photo</button>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">🎥 Video</button>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">🔗 Link</button>
              </div>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Publish</button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Scheduled Posts</h3>
            <div className="text-sm text-slate-500">No scheduled posts</div>
          </Card>
        </div>
      )}

      {tab === "insights" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Total Reach" value="128,450" sub="Last 28 days" />
            <MetricCard label="Page Views" value="8,921" sub="Last 28 days" />
            <MetricCard label="Engagement Rate" value="4.2%" sub="Above average" />
          </div>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Audience Demographics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>🇧🇩 Bangladesh</span><span className="font-medium">78%</span></div>
              <div className="flex items-center justify-between"><span>🇮🇳 India</span><span className="font-medium">12%</span></div>
              <div className="flex items-center justify-between"><span>🇬🇧 United Kingdom</span><span className="font-medium">5%</span></div>
              <div className="flex items-center justify-between"><span>🇺🇸 United States</span><span className="font-medium">5%</span></div>
            </div>
          </Card>
        </div>
      )}

      {tab === "ads" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Ads Manager</h3>
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ <strong>Integration Required:</strong> Connect your Facebook Ads Manager account to view and manage ad campaigns.
            <br />
            Required: META_ACCESS_TOKEN environment variable.
          </div>
          <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Connect Ads Manager</button>
        </Card>
      )}

      {tab === "audience" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Audience Insights</h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <div className="font-medium text-sm">Age & Gender</div>
              <div className="mt-2 h-24 rounded bg-gradient-to-r from-blue-100 to-blue-200" />
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <div className="font-medium text-sm">Top Locations</div>
              <div className="mt-2 text-xs text-slate-500">Dhaka, Chittagong, Sylhet, Rajshahi, Khulna</div>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <div className="font-medium text-sm">Interests</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {["Digital Marketing", "SEO", "Business", "Entrepreneurship", "Technology"].map((t) => (
                  <Badge key={t} className="border-slate-200 bg-slate-50 text-slate-600">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "settings" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Page Settings</h3>
          <div className="space-y-3">
            <SettingRow label="Page Name" value="FOYSAL IT" editable />
            <SettingRow label="Page Category" value="Digital Marketing Service" editable />
            <SettingRow label="About" value="AI-Powered Lead Intelligence & Sales Platform" editable />
            <SettingRow label="Website" value="https://foysalit.com" editable />
            <SettingRow label="Email" value="foysalahmed.dm23@gmail.com" editable />
            <SettingRow label="Phone" value="+880175401123" editable />
            <div className="pt-3 border-t border-slate-100">
              <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Disconnect Page</button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value, change, sub }: { label: string; value: string; change?: string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {change && <div className="text-xs text-emerald-600">{change}</div>}
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </Card>
  );
}

function SettingRow({ label, value, editable }: { label: string; value: string; editable?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        {editable && <button className="text-xs text-blue-600 hover:underline">Edit</button>}
      </div>
    </div>
  );
}
