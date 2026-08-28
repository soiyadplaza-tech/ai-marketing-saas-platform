"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "@/lib/ui";
import { COMPANY } from "@/lib/services";
import Copilot from "@/components/Copilot";
import MobileBottomNav from "@/components/MobileBottomNav";

const NAV: { group: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "📊" },
      { href: "/nova", label: "NOVA AI Meeting", icon: "🎙️" },
      { href: "/agents", label: "AI Agents", icon: "🤖" },
      { href: "/pilot", label: "AI Pilot", icon: "🚀" },
      { href: "/command", label: "AI Command Center", icon: "💬" },
    ],
  },
  {
    group: "Leads & Sales",
    items: [
      { href: "/leads", label: "Leads", icon: "👥" },
      { href: "/pipeline", label: "Sales Pipeline", icon: "🎯" },
      { href: "/import", label: "Add Data", icon: "➕" },
      { href: "/social", label: "Social Media", icon: "📱" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { href: "/audit", label: "Website Auditor", icon: "🔍" },
      { href: "/voice", label: "Voice · ASR", icon: "🎙️" },
      { href: "/ai-settings", label: "AI Providers", icon: "🧠" },
      { href: "/processing", label: "AI Processing", icon: "⚙️" },
    ],
  },
  {
    group: "Outreach",
    items: [
      { href: "/gmail", label: "Gmail + AI", icon: "📧" },
      { href: "/outreach", label: "Messages", icon: "✉️" },
      { href: "/campaigns", label: "Campaigns", icon: "📣" },
      { href: "/automations", label: "Automations", icon: "🔗" },
    ],
  },
  {
    group: "Manage",
    items: [
      { href: "/admin", label: "Admin Control", icon: "👑" },
      { href: "/roadmap", label: "Missing & Future", icon: "🧭" },
      { href: "/config", label: "A-Z Config", icon: "⚙️🅰️" },
      { href: "/database", label: "Database", icon: "🗄️" },
      { href: "/domain", label: "Domain", icon: "🌐" },
      { href: "/google-script", label: "Sheet Script", icon: "📜" },
      { href: "/reports", label: "Reports", icon: "📈" },
      { href: "/integrations", label: "Integrations", icon: "🔌" },
      { href: "/members", label: "Members", icon: "👥" },
      { href: "/monitoring", label: "Live Monitoring", icon: "📡" },
      { href: "/system", label: "System Check", icon: "✅" },
      { href: "/subscription", label: "Subscription", icon: "💳" },
      { href: "/team", label: "Team", icon: "🛡️" },
      { href: "/account", label: "Account", icon: "👤" },
    ],
  },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<{ id: number; title: string; body: string | null; read: boolean; createdAt: string }[]>([]);
  const [me, setMe] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Ensure demo org/data exists, then load notifications.
    fetch("/api/seed", { method: "POST" }).catch(() => {});
    // Auth gate: redirect to login if there is no valid session.
    // Public-safe app-shell pages (like /integrations) remain viewable.
    const publicShellPaths = new Set(["/integrations"]);
    if (!publicShellPaths.has(pathname)) {
      fetch("/api/auth").then((r) => {
        if (r.status === 401) { router.replace("/login"); return; }
        return r.json().then((d) => setMe(d.user || null)).catch(() => {});
      }).catch(() => {});
    }
    // Fire-and-forget: run the enabled Daily Auto Outreach if it hasn't run today.
    fetch("/api/automations/daily", { method: "POST", body: JSON.stringify({ action: "auto-check" }) }).catch(() => {});
    loadNotifs();
    const t = setInterval(loadNotifs, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function loadNotifs() {
    try {
      const r = await fetch("/api/notifications");
      const d = await r.json();
      setNotifs(d.notifications || []);
      setUnread(d.unread || 0);
    } catch {}
  }

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
    loadNotifs();
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
          <img src="/images/logo.png" alt="FOYSAL IT" className="h-9 w-9 rounded-lg object-cover" />
          <div>
            <div className="text-sm font-bold text-white">FOYSAL IT</div>
            <div className="text-[10px] text-slate-400">Lead Intelligence</div>
          </div>
        </div>
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
          {NAV.map((g) => (
            <div key={g.group} className="mb-4">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g.group}</div>
              {g.items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + "/");
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <span className="text-base">{it.icon}</span>
                    {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            ☰
          </button>
          <div className="hidden text-sm text-slate-500 sm:block">
            <span className="font-semibold text-indigo-600">{COMPANY.tagline}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => { setNotifOpen((v) => !v); if (!notifOpen) markAll(); }}
                className="relative rounded-lg p-2 hover:bg-slate-100"
                aria-label="Notifications"
              >
                🔔
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="px-2 py-1 text-xs font-semibold text-slate-500">Notifications</div>
                  {notifs.length === 0 && <div className="px-2 py-6 text-center text-sm text-slate-400">No notifications yet</div>}
                  {notifs.map((n) => (
                    <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-slate-50">
                      <div className="text-sm font-medium text-slate-800">{n.title}</div>
                      {n.body && <div className="text-xs text-slate-500">{n.body}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/account" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100" title="Account & sign out">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-fuchsia-600 to-yellow-400 text-sm font-bold text-white">
                {(me?.name || "FA").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="hidden text-xs leading-tight md:block">
                <div className="font-semibold text-slate-800">{me?.name || "Sign in"}</div>
                <div className="text-slate-400">{me ? "Account" : "Go to login"}</div>
              </div>
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Floating WhatsApp CTA */}
      <a
        href={COMPANY.whatsappLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105"
      >
        <span className="text-lg">💬</span>
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      <Copilot />
      <MobileBottomNav />
    </div>
  );
}
