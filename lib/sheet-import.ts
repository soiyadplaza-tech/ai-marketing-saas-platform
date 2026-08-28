import { db } from "@/db";
import { leads, files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID, logActivity, notify } from "@/lib/repo";
import { csvToLeads, isValidEmail } from "@/lib/parse";
import { baselineScore } from "@/lib/scoring";

// Convert any Google Sheets URL into its CSV export endpoint.
export function toCsvUrl(input: string): string | null {
  if (/\/export\?/.test(input)) return input; // already an export URL
  const m = input.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) return null;
  const id = m[1];
  const gidMatch = input.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export async function loadCsv(body: { url?: string; content?: string }): Promise<{ csv: string; source: string } | { error: string }> {
  if (body.content && body.content.trim()) return { csv: body.content, source: "file_upload" };
  if (body.url) {
    const csvUrl = toCsvUrl(body.url) || body.url;
    const res = await fetch(csvUrl, { redirect: "follow", cache: "no-store" });
    if (!res.ok) {
      return { error: `Could not fetch the sheet (HTTP ${res.status}). Make sure it is shared as "Anyone with the link can view".` };
    }
    const text = await res.text();
    if (text.trim().startsWith("<")) {
      return { error: "The sheet is not publicly accessible. Set sharing to 'Anyone with the link can view' and try again." };
    }
    return { csv: text, source: "google_sheet" };
  }
  return { error: "Provide a Google Sheets URL or file content." };
}

export async function loadExistingEmails(): Promise<Set<string>> {
  const rows = await db.select({ email: leads.email }).from(leads).where(eq(leads.orgId, ORG_ID));
  const set = new Set<string>();
  for (const r of rows) if (r.email) set.add(r.email.toLowerCase());
  return set;
}

export interface ImportResult { inserted: number; dupCount: number; invalidCount: number; total: number; source: string }

// Parse CSV text and create one profile per person (batched). Returns counts.
export async function importCsvToLeads(csv: string, source: string, fileName?: string): Promise<ImportResult> {
  const { leads: parsed } = csvToLeads(csv);
  const valid = parsed.filter((l) => l.company);

  const existingEmails = await loadExistingEmails();
  const seen = new Set<string>();
  const toInsert: (typeof leads.$inferInsert)[] = [];
  let dupCount = 0, invalidCount = 0, priority = 0;

  for (const l of valid) {
    if (l.email && !isValidEmail(l.email)) { invalidCount++; continue; }
    const key = (l.email || l.company + "|" + (l.contactName || "")).toLowerCase();
    if (seen.has(key) || (l.email && existingEmails.has(l.email.toLowerCase()))) { dupCount++; continue; }
    seen.add(key);

    const sc = baselineScore(l);
    if (sc.category === "priority") priority++;
    toInsert.push({
      orgId: ORG_ID,
      company: l.company,
      contactName: l.contactName ?? null,
      title: l.title ?? null,
      email: l.email ?? null,
      phone: l.phone ?? null,
      whatsapp: l.phone ?? null,
      website: l.website ?? null,
      industry: l.industry ?? null,
      location: l.location ?? null,
      socialProfiles: l.socialProfiles ?? {},
      enrichment: l.enrichment ?? {},
      tags: l.tags ?? [],
      source,
      leadScore: sc.score,
      scoreCategory: sc.category,
      scoreReasons: sc.reasons,
      status: "new_lead",
      stage: "new_lead",
    });
  }

  let inserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    if (chunk.length) { await db.insert(leads).values(chunk); inserted += chunk.length; }
  }

  await db.insert(files).values({
    orgId: ORG_ID,
    name: source === "google_sheet" ? "Google Sheet — per-person import" : (fileName || "Sheet upload"),
    fileType: source,
    size: csv.length,
    status: "completed",
    aiStatus: "completed",
    recordsFound: inserted,
    extracted: { inserted, dupCount, invalidCount },
  });

  await logActivity("imported", `Imported ${inserted} per-person profiles (${dupCount} duplicates skipped)`);
  await notify("import_complete", "Import completed", `${inserted} profiles created from the sheet`);
  if (priority) await notify("priority_lead", "Priority leads imported", `${priority} priority profiles found`);

  return { inserted, dupCount, invalidCount, total: valid.length, source };
}

// Auto-import the configured master sheet when the database has no leads.
// Guarded so it only runs once (when empty). Safe to call on app bootstrap.
let autoImportRunning = false;
export async function autoImportIfEmpty(): Promise<void> {
  if (autoImportRunning) return;
  const url = process.env.SHEET_IMPORT_URL;
  if (!url) return;
  const existing = await db.select({ email: leads.email }).from(leads).where(eq(leads.orgId, ORG_ID)).limit(1);
  if (existing.length > 0) return;
  autoImportRunning = true;
  try {
    const loaded = await loadCsv({ url });
    if ("error" in loaded) return;
    await importCsvToLeads(loaded.csv, "google_sheet");
  } catch {
    /* non-fatal */
  } finally {
    autoImportRunning = false;
  }
}
