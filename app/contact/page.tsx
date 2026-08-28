import { COMPANY } from "@/lib/services";
import { MarketingChrome } from "@/components/MarketingChrome";

export const metadata = { title: "Contact — FOYSAL IT" };

export default function ContactPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-extrabold">Let’s grow your pipeline</h1>
        <p className="mt-3 text-sm text-fuchsia-100/70">Call, WhatsApp or email. Or create an account and let the AI Pilot audit + draft outreach for you.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href={`tel:${COMPANY.call}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-fuchsia-300">Call</div>
            <div className="mt-1 text-xl font-bold">{COMPANY.call}</div>
          </a>
          <a href={COMPANY.whatsappLink} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-fuchsia-300">WhatsApp</div>
            <div className="mt-1 text-xl font-bold">{COMPANY.whatsapp}</div>
          </a>
          <a href={`mailto:${COMPANY.email}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-fuchsia-300">Email</div>
            <div className="mt-1 break-all text-xl font-bold">{COMPANY.email}</div>
          </a>
          <a href={COMPANY.website} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
            <div className="text-xs uppercase tracking-wide text-fuchsia-300">Website</div>
            <div className="mt-1 text-xl font-bold">foysalit.com</div>
          </a>
        </div>
      </section>
    </MarketingChrome>
  );
}
