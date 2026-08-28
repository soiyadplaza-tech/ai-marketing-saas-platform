import Link from "next/link";
import { CASE_STUDIES, PORTFOLIO_LINKS } from "@/lib/portfolio";
import { COMPANY } from "@/lib/services";
import { MarketingChrome } from "@/components/MarketingChrome";

export const metadata = {
  title: "Portfolio — FOYSAL IT",
  description: "Real client work: SEO plans, site audits, Google Ads, backlinks, case studies and proofs.",
};

const TAG_STYLE: Record<string, string> = {
  "SEO Plan": "border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-200",
  "Case Study": "border-yellow-300/30 bg-yellow-500/10 text-yellow-200",
  "Web Development": "border-sky-300/30 bg-sky-500/10 text-sky-200",
  "Site Audit": "border-emerald-300/30 bg-emerald-500/10 text-emerald-200",
  Audit: "border-emerald-300/30 bg-emerald-500/10 text-emerald-200",
  "Google Ads": "border-green-300/30 bg-green-500/10 text-green-200",
  Backlinks: "border-cyan-300/30 bg-cyan-500/10 text-cyan-200",
  "Keyword Research": "border-indigo-300/30 bg-indigo-500/10 text-indigo-200",
  Reporting: "border-pink-300/30 bg-pink-500/10 text-pink-200",
};

export default function PortfolioPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">Portfolio</div>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Real work. Real proofs.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-fuchsia-100/70">
            Every project below is documented — audit sheets, campaign proofs, backlink sheets and case studies are in the shared Drive folders.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          {[
            ["📁 All Proofs (Drive)", PORTFOLIO_LINKS.driveProofs],
            ["📁 My Portfolio (Drive)", PORTFOLIO_LINKS.drivePortfolio],
            ["📊 Backlink Master Sheet", PORTFOLIO_LINKS.backlinkSheet],
            ["📄 1-Month SEO Plan (Desert Light)", PORTFOLIO_LINKS.seoPlanDoc],
            ["🌐 Google Sites Portfolio", PORTFOLIO_LINKS.sitesPortfolio],
            ["🏠 Main Website", PORTFOLIO_LINKS.website],
          ].map(([label, url]) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold hover:border-fuchsia-400/40 hover:bg-white/10">
              <span>{label}</span>
              <span className="text-fuchsia-300">Open →</span>
            </a>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CASE_STUDIES.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TAG_STYLE[c.tag] || "border-white/20 text-white/70"}`}>{c.tag}</div>
              <div className="mt-3 text-lg font-bold">{c.client}</div>
              {c.location && <div className="text-xs text-fuchsia-200/60">{c.location}</div>}
              <div className="mt-2 text-sm font-semibold text-fuchsia-100">{c.work}</div>
              <p className="mt-2 text-sm leading-relaxed text-fuchsia-100/60">{c.details}</p>
              {c.source && (
                <a href={c.source} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-fuchsia-300 hover:underline">
                  View proof →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-3xl bg-gradient-to-r from-fuchsia-600/30 to-yellow-500/20 p-8 text-center ring-1 ring-white/10">
          <h2 className="text-2xl font-extrabold">Want results like these for your business?</h2>
          <p className="mt-2 text-sm text-fuchsia-100/70">Free AI audit + a plan built from our 30-year playbooks.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={COMPANY.whatsappLink} className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold">WhatsApp {COMPANY.whatsapp}</a>
            <a href={`tel:${COMPANY.call}`} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-2.5 text-sm font-bold">Call {COMPANY.call}</a>
            <Link href="/register" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold">Open the AI app</Link>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
