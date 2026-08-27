import Link from "next/link";
import { MarketingChrome } from "@/components/MarketingChrome";
import { COMPANY } from "@/lib/services";
import type { PublicPageData } from "@/lib/public-pages";

export function PublicInfoPage({ page }: { page: PublicPageData }) {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">{page.eyebrow}</div>
          <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-extrabold sm:text-5xl">{page.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fuchsia-100/70">{page.description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {page.bullets.map((b) => (
              <span key={b} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-fuchsia-100/70">{b}</span>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {page.sections.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fuchsia-100/65">{s.body}</p>
              {s.items && (
                <ul className="mt-3 space-y-1 text-sm text-fuchsia-100/70">
                  {s.items.map((x) => <li key={x}>✓ {x}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-3xl bg-gradient-to-r from-fuchsia-600/30 to-yellow-500/20 p-8 text-center ring-1 ring-white/10">
          <h2 className="text-2xl font-extrabold">{page.cta}</h2>
          <p className="mt-2 text-sm text-fuchsia-100/70">Talk to FOYSAL IT or open the app and start the workflow.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-6 py-3 text-sm font-bold">Free Trial</Link>
            <a href={COMPANY.whatsappLink} className="rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold">WhatsApp</a>
            <a href={`mailto:${COMPANY.email}`} className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold">Email</a>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
