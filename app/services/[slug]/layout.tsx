import type { Metadata } from "next";
import { SERVICES, type ServiceKey } from "@/lib/services";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SERVICES[slug as ServiceKey];
  return { title: s ? `${s.name} — FOYSAL IT` : "Service — FOYSAL IT" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
