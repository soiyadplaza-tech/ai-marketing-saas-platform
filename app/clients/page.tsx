import Link from "next/link";
import { COMPANY } from "@/lib/services";
import { MarketingChrome } from "@/components/MarketingChrome";

export const metadata = {
  title: "Work With Us — FOYSAL IT",
  description: "What you need to start, what you get every week, and how our AI-audited process works.",
};

const NEED = [
  ["🌐", "Your website (or plan to build one)", "We audit it free in 24 hours. No website? We'll build it."],
  ["📍", "Google Business Profile access", "For local SEO & map ranking work — takes 5 minutes to add us."],
  ["📣", "Ad accounts (Meta / Google)", "Existing or new — we set up tracking the right way from day one."],
  ["🎯", "Your goal in one sentence", "“More phone calls”, “more form fills”, “more store sales” — that's enough."],
  ["📞", "A 15-minute intro call", "We walk through your free audit and the plan. No obligation."],
];

const WEEKLY = [
  "Every fix logged in one report (nothing disappears)",
  "Ranking + traffic snapshot for the keywords that pay",
  "Ad spend vs. leads table (cost per lead, weekly)",
  "Next week's plan — so you always know what's happening",
];

const STEPS = [
  ["1", "Free AI Audit (24h)", "We run a full website, local SEO, ads and tracking audit. You get a professional PDF report — free, no strings."],
  ["2", "Plan & Price", "We show the top 3 fixes that will bring customers first, with a clear monthly price. You approve — nothing starts without you."],
  ["3", "We Execute", "Our team + AI robot handle SEO, ads, content, backlinks, tracking. You watch the weekly report."],
  ["4", "We Report & Scale", "Weekly proof, monthly deep-dive. What works gets more budget; what doesn't gets cut."],
];

const FAQ = [
  ["How long until results?", "Tracking + quick wins in week 1–2. Meaningful traffic/ranking movement typically in 4–6 weeks. Local map results can come faster."],
  ["Do I need a big budget for ads?", "No. We start small (test budget), prove the cost per lead, then scale only what works."],
  ["Who actually does the work?", "Foysal IT's team — audits, strategy and execution by a senior digital marketing specialist, with an AI assistant handling research and reporting daily."],
  ["Can I cancel anytime?", "Yes — monthly contracts, 15-day notice. Your accounts and data stay yours."],
  ["What makes FOYSAL IT different?", "Every client starts with a real AI website audit, you see the exact problems before we price the fix, and you get a weekly report with proof — not promises."],
];

export default function ClientsPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">For Clients</div>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">What you need to start — and what you get</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-fuchsia-100/70">
            No confusing jargon. Here's exactly what we need from you, what we deliver every week, and how the process works from free audit to results.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">What we need from you <span className="text-sm font-normal text-fuchsia-200/60">(one-time)</span></h2>
            <div className="mt-4 space-y-3">
              {NEED.map(([icon, title, desc]) => (
                <div key={title} className="flex gap-3">
                  <div className="text-xl">{icon}</div>
                  <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-sm text-fuchsia-100/60">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">What you get <span className="text-sm font-normal text-fuchsia-200/60">(every week)</span></h2>
            <div className="mt-4 space-y-3">
              {WEEKLY.map((w) => (
                <div key={w} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">✓</span>
                  <div className="text-sm text-fuchsia-100/80">{w}</div>
                </div>
              ))}
              <div className="mt-4 rounded-xl bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100/70">
                Plus: real proof from our client work — see the <Link href="/portfolio" className="font-semibold text-fuchsia-300 hover:underline">Portfolio →</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-center text-2xl font-extrabold">How it works — 4 steps</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-lg font-black">{n}</div>
                <div className="mt-3 font-bold">{t}</div>
                <div className="mt-2 text-sm text-fuchsia-100/60">{d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-center text-2xl font-extrabold">Questions clients ask</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-white/10 bg-white/5 p-5">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">{q}</summary>
                <p className="mt-3 text-sm leading-relaxed text-fuchsia-100/70">{a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-to-r from-fuchsia-600/30 to-yellow-500/20 p-8 text-center ring-1 ring-white/10">
          <h2 className="text-2xl font-extrabold">Ready? Get your free AI audit today.</h2>
          <p className="mt-2 text-sm text-fuchsia-100/70">Send your website link — the report lands in your inbox within 24 hours.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={COMPANY.whatsappLink} className="rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold">WhatsApp {COMPANY.whatsapp}</a>
            <a href={`mailto:${COMPANY.email}?subject=Free AI Audit Request`} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-3 text-sm font-bold">Email {COMPANY.email}</a>
            <a href={`tel:${COMPANY.call}`} className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold">Call {COMPANY.call}</a>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
