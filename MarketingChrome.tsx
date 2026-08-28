import Link from "next/link";
import { COMPANY } from "@/lib/services";

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#180420] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-25" style={{ background: "radial-gradient(circle at 15% 10%, #7c3aed 0%, transparent 40%), radial-gradient(circle at 85% 30%, #eab308 0%, transparent 35%)" }} />
      <div className="relative">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="FOYSAL IT" className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10" />
            <div>
              <div className="text-lg font-extrabold tracking-wide">{COMPANY.name}</div>
              <div className="text-[11px] text-fuchsia-200/60">{COMPANY.tagline}</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-fuchsia-100/80 md:flex">
            <Link href="/features" className="hover:text-white">Features</Link>
            <Link href="/solutions" className="hover:text-white">Solutions</Link>
            <Link href="/ai" className="hover:text-white">AI</Link>
            <Link href="/services" className="hover:text-white">Services</Link>
            <Link href="/portfolio" className="hover:text-white">Portfolio</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
            <Link href="/free-trial" className="rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2 font-bold text-white">Free Trial</Link>
          </nav>
          <Link href="/login" className="rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-bold md:hidden">App</Link>
        </header>
        {children}
        <footer className="border-t border-white/10 py-8 text-center text-xs text-fuchsia-100/50">
          <div className="font-semibold text-fuchsia-100/70">{COMPANY.name} · {COMPANY.website}</div>
          <div className="mt-2">✆ {COMPANY.call} · {COMPANY.whatsapp} · {COMPANY.email}</div>
        </footer>
      </div>
    </div>
  );
}
