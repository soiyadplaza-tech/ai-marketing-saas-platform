import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Export every lead (all data, including enrichment) as CSV download.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(100000, Number(url.searchParams.get("limit") || 20000));
  const rows = await db.select().from(leads).where(eq(leads.orgId, ORG_ID)).orderBy(desc(leads.leadScore)).limit(limit);

  const headers = [
    "id", "company", "contactName", "title", "email", "phone", "whatsapp", "website",
    "industry", "location", "leadScore", "scoreCategory", "websiteScore", "seoScore",
    "localSeoScore", "socialScore", "recommendedServices", "stage", "source",
    "lastContactedAt", "created_at", "keywords", "city", "state", "country", "employees",
  ];

  const lines = [headers.join(",")];
  for (const l of rows) {
    const en = (l.enrichment || {}) as Record<string, string>;
    lines.push([
      l.id, l.company, l.contactName, l.title, l.email, l.phone, l.whatsapp, l.website,
      l.industry, l.location, l.leadScore, l.scoreCategory, l.websiteScore, l.seoScore,
      l.localSeoScore, l.socialScore, (l.recommendedServices || []).join("|"), l.stage, l.source,
      l.lastContactedAt ? new Date(l.lastContactedAt).toISOString() : "",
      new Date(l.createdAt).toISOString(),
      en.Keywords || en["Keywords"] || "",
      en.City || en["Company City"] || "",
      en.State || en["Company State"] || "",
      en.Country || en["Company Country"] || "",
      en["# Employees"] || "",
    ].map(csvEscape).join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="foysal-it-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
