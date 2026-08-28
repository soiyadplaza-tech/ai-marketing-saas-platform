import Link from "next/link";
import { SERVICE_LIST, SERVICE_DETAILS, COMPANY } from "@/lib/services";
import { MarketingChrome } from "@/components/MarketingChrome";

export const metadata = {
  title: "Our Services — FOYSAL IT",
  description: "SEO, ads, social, tracking, web development and full digital marketing by FOYSAL IT.",
};

export default function ServicesPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-6 pb-6 pt-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">Our Services</div>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Everything we deliver — and what the AI recommends</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-fuchsia-100/70">
          FOYSAL IT audits a business, matches the exact service, then writes human outreach. Pick a service to see deliverables, process and how to start.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={COMPANY.whatsappLink} className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold">WhatsApp</a>
          <a href={`tel:${COMPANY.call}`} className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-2.5 text-sm font-bold">Call {COMPANY.call}</a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_LIST.map((s) => {
            const d = SERVICE_DETAILS[s.key];
            return (
              <Link key={s.key} href={`/services/${s.key}`} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-fuchsia-400/40 hover:bg-white/10">
                <div className="text-2xl">{s.icon || "✦"}</div>
                <div className="mt-3 text-lg font-bold">{s.name}</div>
                <p className="mt-1 text-sm text-fuchsia-100/70">{d.headline}</p>
                <div className="mt-4 text-xs font-semibold text-fuchsia-300">See deliverables →</div>
              </Link>
            );
          })}
        </div>
      </section>
    </MarketingChrome>
  );
}
