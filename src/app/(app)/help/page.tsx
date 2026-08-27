import Link from "next/link";
import { Card } from "@/lib/ui";

const TOPICS = [
  {
    q: "How do I import my leads?",
    a: "Go to Add Data (➕). Paste your Google Sheet link, or upload a CSV. The AI auto-maps columns (Company, Email, Phone, Website, Industry, Location), detects duplicates, and creates one profile per person.",
  },
  {
    q: "How does the AI audit work?",
    a: "The auditor fetches each lead's real website and checks HTTPS, meta tags, headings, schema, tracking pixels (GA/GTM/Meta/Google Ads), local signals and more. It scores 0–100 across Technical, On-Page, Performance, Conversion, Local and Social.",
  },
  {
    q: "What is the AI Lead Score?",
    a: "A 0–100 score based on contactability, business relevance, detected service-fit opportunities and the website audit gap. 0–39 Cold, 40–59 Warm, 60–79 Hot, 80–100 Priority. The full reasoning is always shown on the lead profile.",
  },
  {
    q: "How does the daily email robot work?",
    a: "The AI Pilot audits new leads, writes human-like personalized emails from the real findings, auto-approves a small batch, and sends via Gmail (backup: Resend/SendGrid). It respects the 400–1500/day cap and the opt-out list.",
  },
  {
    q: "Can I review before emails are sent?",
    a: "Yes. Every email is a draft first. You approve in small batches (5/10/25) in the Messages page before anything goes out. Nothing is ever sent blind.",
  },
  {
    q: "How do I move a lead through the sales pipeline?",
    a: "Open the Pipeline (🎯) and drag a card between stages — New Lead → Researching → … → Won. On mobile the status changes are instant (optimistic) and sync to your database.",
  },
  {
    q: "Where is my data stored?",
    a: "In your own permanent Neon PostgreSQL database. It survives restarts and is the same database your production Vercel deployment uses.",
  },
];

const SHORTCUTS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊", d: "KPIs, priority leads, opportunities" },
  { href: "/pilot", label: "AI Pilot", icon: "🚀", d: "Daily auto-audit + email robot" },
  { href: "/command", label: "AI Command Center", icon: "🤖", d: "Ask anything in plain language" },
  { href: "/leads", label: "Leads (Jadur Box)", icon: "📦", d: "Your full lead database" },
  { href: "/audit", label: "Website Auditor", icon: "🔍", d: "Audit any website for free" },
  { href: "/domain", label: "Domain & Email Robot", icon: "🔗", d: "foysalit.com + mail setup" },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 animate-fadein">
      <div>
        <h1 className="text-2xl font-bold">Help &amp; Support</h1>
        <p className="text-sm text-slate-500">Quick answers, shortcuts, and how to reach us.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-700 p-5 text-white">
          <div className="font-bold">Need a hand? Talk to the FOYSAL IT team</div>
          <div className="mt-1 text-sm text-fuchsia-100/80">Fast, human support — call or WhatsApp.</div>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-3">
          <a href="tel:+880175401123" className="rounded-lg border border-slate-200 p-3 text-center text-sm hover:bg-slate-50">
            <div className="text-xl">📞</div>
            <div className="mt-1 font-semibold">Call</div>
            <div className="text-xs text-slate-500">+880175401123</div>
          </a>
          <a href="https://wa.me/8801732088210" target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-3 text-center text-sm hover:bg-slate-50">
            <div className="text-xl">💬</div>
            <div className="mt-1 font-semibold">WhatsApp</div>
            <div className="text-xs text-slate-500">+8801732088210</div>
          </a>
          <a href="mailto:foysalahmed.dm23@gmail.com" className="rounded-lg border border-slate-200 p-3 text-center text-sm hover:bg-slate-50">
            <div className="text-xl">✉️</div>
            <div className="mt-1 font-semibold">Email</div>
            <div className="text-xs text-slate-500">foysalahmed.dm23@gmail.com</div>
          </a>
        </div>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-bold">Shortcuts</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-300">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="font-semibold">{s.label}</div>
                <div className="text-xs text-slate-500">{s.d}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold">FAQ</h2>
        <div className="space-y-2">
          {TOPICS.map((t) => (
            <details key={t.q} className="group rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden">{t.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
