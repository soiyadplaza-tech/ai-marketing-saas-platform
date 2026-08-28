"use client";

import Link from "next/link";
import { SERVICE_LIST, COMPANY } from "@/lib/services";

const FLOW = [
  { icon: "📥", label: "Import", desc: "Google Sheet / CSV / AI text" },
  { icon: "🔍", label: "AI Audit", desc: "Website, SEO, Local, Ads, Tracking" },
  { icon: "🎯", label: "Score & Match", desc: "0–100 score + service fit" },
  { icon: "✉️", label: "Outreach", desc: "Human-like AI emails, auto-sent" },
  { icon: "📈", label: "Pipeline", desc: "Meetings → proposals → clients" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#180420] text-white">
      {/* Glow background */}
      <div className="pointer-events-none fixed inset-0 opacity-25" style={{ background: "radial-gradient(circle at 15% 10%, #7c3aed 0%, transparent 40%), radial-gradient(circle at 85% 30%, #eab308 0%, transparent 35%), radial-gradient(circle at 50% 90%, #db2777 0%, transparent 40%)" }} />

      <div className="relative">
        {/* Nav */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="FOYSAL IT" className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/20 shadow-lg shadow-fuchsia-900/50" />
            <div>
              <div className="text-lg font-extrabold tracking-wide">{COMPANY.name}</div>
              <div className="text-[11px] text-fuchsia-200/60">{COMPANY.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/services" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-fuchsia-100/80 hover:text-white sm:inline">Services</Link>
            <Link href="/portfolio" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-fuchsia-100/80 hover:text-white sm:inline">Portfolio</Link>
            <Link href="/clients" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-fuchsia-100/80 hover:text-white sm:inline">Work With Us</Link>
            <Link href="/contact" className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-fuchsia-100/80 hover:text-white sm:inline">Contact</Link>
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-fuchsia-100/80 hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 text-sm font-bold shadow-lg shadow-fuchsia-900/40 hover:from-fuchsia-500 hover:to-purple-500">Get Started</Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-14 pb-10 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-semibold text-fuchsia-200">
            ✨ AI-Powered Lead Intelligence · Digital Audit · Outreach Automation
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Turn Every Lead Into An{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">Opportunity</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-fuchsia-100/70">
            FOYSAL IT imports your leads, runs a full AI website & marketing audit, finds the exact service each business needs,
            scores them, and sends human-like outreach automatically — so you close more clients while you sleep.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={COMPANY.whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:scale-[1.02]">
              💬 WhatsApp Us
            </a>
            <a href={`tel:${COMPANY.call}`} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-3 text-sm font-bold shadow-lg shadow-fuchsia-900/40 hover:scale-[1.02]">
              ✆ {COMPANY.call}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="flex items-center gap-2 rounded-xl border border-fuchsia-400/30 bg-white/5 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              ✉️ {COMPANY.email}
            </a>
            <a href={COMPANY.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-6 py-3 text-sm font-semibold text-yellow-200 hover:bg-yellow-400/20">
              🌐 Our Application
            </a>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-5">
              {FLOW.map((s, i) => (
                <div key={s.label} className="relative rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <div className="text-2xl">{s.icon}</div>
                  <div className="mt-2 text-sm font-bold">{s.label}</div>
                  <div className="mt-1 text-xs text-fuchsia-100/60">{s.desc}</div>
                  {i < FLOW.length - 1 && <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-fuchsia-400/50 sm:block">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-6xl px-6 py-10">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold">Our Services</h2>
            <p className="mt-2 text-sm text-fuchsia-100/60">Everything the AI audits, scores and recommends — delivered by FOYSAL IT.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LIST.map((s) => (
              <Link key={s.key} href={`/services/${s.key}`} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-fuchsia-400/40 hover:bg-white/10">
                <div className="text-2xl">{s.icon}</div>
                <div className="mt-3 font-bold">{s.name}</div>
                <div className="mt-1 text-sm text-fuchsia-100/60">{s.description}</div>
                <div className="mt-3 text-xs font-semibold text-fuchsia-300">Details →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 py-12 text-center">
          <div className="rounded-3xl bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-yellow-500/20 p-8 ring-1 ring-white/10">
            <h2 className="text-3xl font-extrabold">Ready to automate your sales?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-fuchsia-100/70">
              Connect your master spreadsheet, let the AI audit every lead and start sending professional outreach today.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-8 py-3 text-sm font-bold shadow-lg shadow-fuchsia-900/40 hover:scale-[1.02]">
                Create Free Account
              </Link>
              <Link href="/login" className="rounded-xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold hover:bg-white/10">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-fuchsia-100/50">
          <div className="font-semibold text-fuchsia-100/70">{COMPANY.name} — {COMPANY.tagline}</div>
          <div className="mt-2">✆ {COMPANY.call} · {COMPANY.whatsapp} · {COMPANY.email}</div>
          <div className="mt-1">{COMPANY.website}</div>
        </footer>
      </div>
    </div>
  );
}
