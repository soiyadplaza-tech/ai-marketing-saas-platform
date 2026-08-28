import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/domain";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicPages = [
    "",
    "/about",
    "/features",
    "/solutions",
    "/ai",
    "/agency-os",
    "/business-os",
    "/services",
    "/integrations",
    "/pricing",
    "/enterprise",
    "/security",
    "/documentation",
    "/faq",
    "/contact",
    "/portfolio",
    "/clients",
    "/free-trial",
    "/login",
    "/register",
  ];
  return publicPages.map((p) => ({
    url: `${APP_URL}${p}`,
    lastModified: now,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : p === "/services" || p === "/pricing" ? 0.9 : 0.7,
  }));
}
