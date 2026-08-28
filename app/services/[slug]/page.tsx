import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES, SERVICE_DETAILS, SERVICE_LIST, COMPANY, type ServiceKey } from "@/lib/services";
import { MarketingChrome } from "@/components/MarketingChrome";

export function generateStaticParams() {
  return SERVICE_LIST.map((s) => ({ slug: s.key }));
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = slug as ServiceKey;
  const s = SERVICES[key];
  const d = SERVICE_DETAILS[key];
  if (!s || !d) notFound();

  return (
    <MarketingChrome>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-8">
        <Link href="/services" className="text-sm text-fuchsia-300 hover:text-white">← All services</Link>
        <div className="mt-4 text-3xl">{s.icon || "✦"}</div>
        <h1 className="mt-2 text-4xl font-extrabold">{s.name}</h1>
        <p className="mt-3 text-lg text-fuchsia-100/80">{d.headline}</p>
        <p className="mt-2 text-sm text-fuchsia-100/60">{d.outcome}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold">What you get</h2>
            <ul className="mt-3 space-y-2 text-sm text-fuchsia-100/80">
              {d.deliverables.map((x) => <li key={x}>✓ {x}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-bold">How we work</h2>
            <ol className="mt-3 space-y-2 text-sm text-fuchsia-100/80">
              {d.process.map((x, i) => <li key={x}>{i + 1}. {x}</li>)}
            </ol>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5">
          <h2 className="font-bold">What we need from you to start</h2>
          <ul className="mt-2 space-y-1 text-sm text-fuchsia-100/70">
            <li>1. Your website link (or let us build it)</li>
            <li>2. Google Business Profile / ad account access (if applicable)</li>
            <li>3. Your goal in one sentence + a 15-minute call</li>
          </ul>
          <Link href="/clients" className="mt-3 inline-block text-sm font-semibold text-yellow-300 hover:underline">Full client guide — what you get every week →</Link>
        </div>

        <div className="mt-8 rounded-2xl bg-gradient-to-r from-fuchsia-600/30 to-yellow-500/20 p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-bold">Start with a free AI audit</h2>
          <p className="mt-2 text-sm text-fuchsia-100/70">Send your website. We score it, match this service if it fits, and send a human-like plan.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={COMPANY.whatsappLink} className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold">WhatsApp {COMPANY.whatsapp}</a>
            <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(s.name + " enquiry")}`} className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-purple-800">Email {COMPANY.email}</a>
            <Link href="/register" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold">Open the app</Link>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
