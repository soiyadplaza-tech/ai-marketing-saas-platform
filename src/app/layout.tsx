import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { APP_URL } from "@/lib/domain";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "FOYSAL IT — AI Lead Intelligence & Sales Platform",
  description:
    "AI-powered lead intelligence, digital audit, marketing opportunity, outreach automation and sales management platform. Turn every lead into an opportunity.",
  alternates: { canonical: APP_URL },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FOYSAL IT" },
  formatDetection: { telephone: false },
  other: { "mobile-web-app-capable": "yes", "apple-mobile-web-app-title": "FOYSAL IT" },
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  openGraph: {
    title: "FOYSAL IT",
    description: "Turn every lead into an opportunity.",
    url: APP_URL,
    siteName: "FOYSAL IT",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
