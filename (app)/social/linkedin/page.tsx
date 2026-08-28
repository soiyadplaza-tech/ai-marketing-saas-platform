"use client";

import { useState } from "react";
import { Card, Badge } from "@/lib/ui";
import Link from "next/link";

export default function LinkedInPage() {
  const [tab, setTab] = useState("overview");
  const [connected, setConnected] = useState(false);

  const tabs = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "posts", label: "Posts", icon: "📝" },
    { key: "analytics", label: "Analytics", icon: "📈" },
    { key: "connections", label: "Connections", icon: "👥" },
    { key: "jobs", label: "Jobs", icon: "💼" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  if (!connected) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 animate-fadein">
        <div className="flex items-center gap-3">
          <Link href="/social" className="text-slate-400 hover:text-slate-600">← Back</Link>
          <h1 className="text-2xl font-bold">LinkedIn Company Page</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-5xl mb-4">💼</div>
          <h2 className="text-xl font-semibold mb-2">Connect Your LinkedIn Page</h2>
          <p className="text-sm text-slate-500 mb-4">Manage company posts, analytics, connections, and job postings.</p>
          <button onClick={() => setConnected(true)} className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-600">
            Connect LinkedIn Account
          </button>
          <p className="mt-4 text-xs text-slate-400">Requires LinkedIn Page Admin access</p>
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
            <span className="text-2xl">💼</span>
            <div>
              <h1 className="text-xl font-bold">FOYSAL IT</h1>
              <p className="text-xs text-slate-500">LinkedIn Company Page</p>
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
            className={`px-4 py-2 text-sm font-medium ${tab === t.key ? "border-b-2 border-blue-700 text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <MetricCard label="Followers" value="5,892" change="+4.2%" />
            <MetricCard label="Page Views" value="12,458" change="+2.1%" />
            <MetricCard label="Post Impressions" value="89,234" change="+15.3%" />
            <MetricCard label="Engagement" value="4,521" change="+6.8%" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Recent Updates</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-slate-100 p-3">
                    <div className="font-medium text-sm">Exciting News: FOYSAL IT Launches New AI Platform #{i}</div>
                    <div className="text-xs text-slate-500 mt-1">Posted {i} week{i > 1 ? "s" : ""} ago</div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span>👍 {Math.floor(Math.random() * 300)}</span>
                      <span>💬 {Math.floor(Math.random() * 50)}</span>
                      <span>↗️ {Math.floor(Math.random() * 80)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Page Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Follower Growth</span>
                  <span className="font-medium text-emerald-600">+247 this month</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-3/4 rounded-full bg-blue-700" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Engagement Rate</span>
                  <span className="font-medium text-emerald-600">5.2% (Industry avg: 2.1%)</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-1/2 rounded-full bg-emerald-500" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Create Post</h3>
            <textarea className="w-full rounded-lg border border-slate-300 p-3 text-sm" rows={4} placeholder="Share an update with your network..." />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">📷 Image</button>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">📄 Document</button>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">🔗 Link</button>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">🎥 Video</button>
              </div>
              <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Post</button>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Scheduled Posts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div>
                  <div className="font-medium text-sm">Weekly Marketing Tips - Episode 12</div>
                  <div className="text-xs text-slate-500">Scheduled for Tomorrow, 10:00 AM</div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button className="text-xs text-rose-600 hover:underline">Cancel</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Total Impressions" value="234K" sub="Last 30 days" />
            <MetricCard label="Unique Visitors" value="18,492" sub="Last 30 days" />
            <MetricCard label="Click-Through Rate" value="3.8%" sub="Above average" />
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Follower Demographics</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2">By Industry</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between"><span>Marketing & Advertising</span><span>32%</span></div>
                  <div className="flex items-center justify-between"><span>Technology</span><span>24%</span></div>
                  <div className="flex items-center justify-between"><span>Business Services</span><span>18%</span></div>
                  <div className="flex items-center justify-between"><span>Other</span><span>26%</span></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">By Seniority</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between"><span>Owner / Founder</span><span>28%</span></div>
                  <div className="flex items-center justify-between"><span>Director</span><span>22%</span></div>
                  <div className="flex items-center justify-between"><span>Manager</span><span>31%</span></div>
                  <div className="flex items-center justify-between"><span>Entry Level</span><span>19%</span></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "connections" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Company Connections</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700" />
                  <div>
                    <div className="font-medium text-sm">Professional Name {i}</div>
                    <div className="text-xs text-slate-500">CEO at Company {i} • Marketing</div>
                  </div>
                </div>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs">Message</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "jobs" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Job Postings</h3>
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 mb-4">
            💼 Post jobs to reach qualified candidates on LinkedIn.
          </div>
          <button className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Post a Job</button>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <div className="font-medium text-sm">Digital Marketing Specialist</div>
                <div className="text-xs text-slate-500">Posted 5 days ago • 45 applicants</div>
              </div>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge>
            </div>
          </div>
        </Card>
      )}

      {tab === "settings" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Page Settings</h3>
          <div className="space-y-3">
            <SettingRow label="Company Name" value="FOYSAL IT" editable />
            <SettingRow label="Tagline" value="AI-Powered Lead Intelligence Platform" editable />
            <SettingRow label="Industry" value="Marketing Services" editable />
            <SettingRow label="Company Size" value="11-50 employees" editable />
            <SettingRow label="Website" value="https://foysalit.com" editable />
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
