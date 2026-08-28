"use client";

import { useState } from "react";
import { Card, Badge } from "@/lib/ui";
import Link from "next/link";

export default function TikTokPage() {
  const [tab, setTab] = useState("overview");
  const [connected, setConnected] = useState(false);

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "videos", label: "Videos", icon: "🎬" },
    { key: "analytics", label: "Analytics", icon: "📈" },
    { key: "trends", label: "Trends", icon: "🔥" },
    { key: "live", label: "LIVE", icon: "🔴" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  if (!connected) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 animate-fadein">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-slate-400 hover:text-slate-600">← Back</Link>
          <h1 className="text-2xl font-bold">TikTok Business</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">🎵</div>
          <h2 className="text-xl font-semibold mb-2">Connect Your TikTok Account</h2>
          <p className="text-sm text-slate-500 mb-4">Manage videos, analytics, trends, and LIVE streams from one dashboard.</p>
          <button onClick={() => setConnected(true)} className="rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-slate-800">
            Connect TikTok Account
          </button>
          <p className="mt-4 text-xs text-slate-400">Requires TikTok Business or Creator account</p>
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
            <span className="text-2xl">🎵</span>
            <div>
              <h1 className="text-xl font-bold">@foysalit</h1>
              <p className="text-xs text-slate-500">TikTok Business Account</p>
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
            className={`px-4 py-2 text-sm font-medium ${tab === t.key ? "border-b-2 border-black text-black" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Followers" value="8,452" change="+12.3%" />
            <MetricCard label="Total Likes" value="124,589" change="+8.1%" />
            <MetricCard label="Video Views" value="892,451" change="+25.4%" />
            <MetricCard label="Profile Views" value="15,892" change="+3.2%" />
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Recent Videos</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="h-16 w-28 rounded bg-gradient-to-br from-black to-slate-800" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Digital Marketing Tips #{i}</div>
                    <div className="text-xs text-slate-500">Posted {i * 2} days ago</div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>▶️ {(Math.random() * 50).toFixed(1)}K</span>
                      <span>❤️ {(Math.random() * 5).toFixed(1)}K</span>
                      <span>💬 {Math.floor(Math.random() * 500)}</span>
                      <span>↗️ {Math.floor(Math.random() * 200)}</span>
                    </div>
                  </div>
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Edit</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "videos" && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Upload New Video</h3>
            <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center">
              <div className="text-3xl mb-2">📁</div>
              <div className="font-medium">Drag and drop video files here</div>
              <div className="text-xs text-slate-500">MP4, MOV up to 10 minutes</div>
              <button className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">Select Files</button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Video Library</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-lg border border-slate-100 overflow-hidden">
                  <div className="aspect-[9/16] bg-gradient-to-br from-slate-800 to-black" />
                  <div className="p-2">
                    <div className="text-xs font-medium truncate">Marketing Tip #{i}</div>
                    <div className="text-[10px] text-slate-500">{(Math.random() * 100).toFixed(1)}K views</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Total Views" value="892K" sub="Last 28 days" />
            <MetricCard label="Avg Watch Time" value="24s" sub="Above average" />
            <MetricCard label="Engagement Rate" value="8.4%" sub="Excellent" />
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Follower Growth</h3>
            <div className="h-40 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100" />
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">This month</span>
              <span className="font-semibold text-emerald-600">+1,247 followers</span>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Top Performing Videos</h3>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <div className="font-medium text-sm">SEO Hack That Changed Everything #{i}</div>
                  <div className="text-sm text-slate-500">{(Math.random() * 500 + 100).toFixed(0)}K views</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "trends" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Trending Sounds & Hashtags</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">🔥 Trending Sounds</h4>
              <div className="space-y-2">
                {["Original Sound - Marketing Pro", "Trending Beat 2026", "Business Motivation Mix"].map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-2">
                    <span className="text-sm">🎵 {s}</span>
                    <button className="text-xs text-blue-600 hover:underline">Use</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2"># Trending Hashtags</h4>
              <div className="flex flex-wrap gap-2">
                {["#DigitalMarketing", "#SEO", "#BusinessTips", "#MarketingStrategy", "#Entrepreneur", "#SmallBusiness", "#SocialMediaTips", "#ContentCreator"].map((t) => (
                  <Badge key={t} className="border-slate-200 bg-slate-50 text-slate-600">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "live" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">LIVE Studio</h3>
          <div className="rounded-lg bg-slate-900 p-8 text-center">
            <div className="text-4xl mb-3">🔴</div>
            <h4 className="font-semibold text-white mb-2">Go LIVE</h4>
            <p className="text-xs text-slate-400 mb-4">Connect with your audience in real-time</p>
            <button className="rounded-lg bg-rose-600 px-6 py-3 font-semibold text-white">Start LIVE Stream</button>
          </div>
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            💡 Tip: Schedule LIVE sessions in advance to maximize viewer turnout.
          </div>
        </Card>
      )}

      {tab === "settings" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Account Settings</h3>
          <div className="space-y-3">
            <SettingRow label="Username" value="@foysalit" editable />
            <SettingRow label="Display Name" value="FOYSAL IT" editable />
            <SettingRow label="Bio" value="AI-Powered Marketing Solutions 🚀" editable />
            <SettingRow label="Website" value="foysalit.com" editable />
            <SettingRow label="Email" value="foysalahmed.dm23@gmail.com" editable />
            <SettingRow label="Category" value="Business & Marketing" editable />
            <div className="pt-3 border-t border-slate-100">
              <button className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Disconnect Account</button>
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
