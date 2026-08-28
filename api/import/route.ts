import { db } from "@/db";
import { leads, files } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { ORG_ID, logActivity, notify } from "@/lib/repo";
import { csvToLeads, textToLeads, normalizeLead, isValidEmail, type ParsedLead } from "@/lib/parse";
import { baselineScore } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// mode: "preview" (parse + map + dedup check, no insert) | "commit" (insert)
export async function POST(req: Request) {
  const body = await req.json();
  const mode = body.mode || "preview";
  const kind = body.kind || "csv"; // csv | text | manual
  let parsed: ParsedLead[] = [];
  let mapping: Record<string, string> = {};

  if (kind === "csv") {
    const res = csvToLeads(body.content || "");
    parsed = res.leads;
    mapping = res.mapping;
  } else if (kind === "text") {
    parsed = textToLeads(body.content || "");
  } else if (kind === "manual") {
    parsed = (body.leads || []).map((l: ParsedLead) => normalizeLead(l));
  }

  parsed = parsed.map(normalizeLead).filter((l) => l.company);

  // Duplicate detection against DB + within batch
  const seen = new Set<string>();
  const results: Array<{ lead: ParsedLead; status: "new" | "duplicate" | "invalid"; reason?: string }> = [];
  for (const l of parsed) {
    if (!isValidEmail(l.email)) {
      results.push({ lead: l, status: "invalid", reason: "Invalid email" });
      continue;
    }
    const key = (l.email || l.website || l.company).toLowerCase();
    if (seen.has(key)) {
      results.push({ lead: l, status: "duplicate", reason: "Duplicate in file" });
      continue;
    }
    seen.add(key);
    const checks = [];
    if (l.email) checks.push(eq(leads.email, l.email));
    if (l.website) checks.push(eq(leads.website, l.website));
    let dup = false;
    if (checks.length) {
      const existing = await db
        .select({ id: leads.id })
        .from(leads)
        .where(and(eq(leads.orgId, ORG_ID), or(...checks)))
        .limit(1);
      dup = existing.length > 0;
    }
    results.push({ lead: l, status: dup ? "duplicate" : "new", reason: dup ? "Already in database" : undefined });
  }

  const newLeads = results.filter((r) => r.status === "new");
  const dupCount = results.filter((r) => r.status === "duplicate").length;
  const invalidCount = results.filter((r) => r.status === "invalid").length;

  if (mode === "preview") {
    return Response.json({
      mode,
      mapping,
      total: parsed.length,
      newCount: newLeads.length,
      dupCount,
      invalidCount,
      sample: results.slice(0, 100),
    });
  }

  // Commit
  let inserted = 0;
  let priority = 0;
  for (const r of newLeads) {
    const l = r.lead;
    const sc = baselineScore(l);
    await db.insert(leads).values({
      orgId: ORG_ID,
      company: l.company,
      contactName: l.contactName,
      title: l.title ?? null,
      email: l.email,
      phone: l.phone,
      whatsapp: l.phone,
      website: l.website,
      industry: l.industry,
      location: l.location,
      socialProfiles: l.socialProfiles ?? {},
      enrichment: l.enrichment ?? {},
      tags: l.tags ?? [],
      source: kind === "csv" ? "csv_import" : kind === "text" ? "ai_text" : "manual",
      leadScore: sc.score,
      scoreCategory: sc.category,
      scoreReasons: sc.reasons,
      status: "new_lead",
      stage: "new_lead",
    });
    inserted++;
    if (sc.category === "priority") priority++;
  }

  await db.insert(files).values({
    orgId: ORG_ID,
    name: body.fileName || `${kind} import`,
    fileType: kind,
    size: (body.content || "").length,
    status: "completed",
    aiStatus: "completed",
    recordsFound: inserted,
    extracted: { newCount: inserted, dupCount, invalidCount },
  });

  await logActivity("imported", `Imported ${inserted} leads (${dupCount} duplicates skipped)`);
  await notify("import_complete", "Import completed", `${inserted} leads imported successfully`);
  if (priority) await notify("priority_lead", "Priority leads imported", `${priority} priority leads found`);

  return Response.json({ mode, inserted, dupCount, invalidCount });
}
