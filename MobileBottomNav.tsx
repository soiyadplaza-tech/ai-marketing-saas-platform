"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// (3) Mobile-only bottom navigation with safe-area padding.
// Shows on < 768px, hidden on desktop (preserves all web layout).
const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/leads", label: "Jadur Box", icon: "📦" },
  { href: "/pilot", label: "Dashboard", icon: "📊" },
  { href: "/help", label: "Help", icon: "❓" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary">
      {ITEMS.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <span className="bi nav-icon">{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
