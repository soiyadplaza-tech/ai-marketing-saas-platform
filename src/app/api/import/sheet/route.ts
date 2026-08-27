import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { csvToLeads, isValidEmail, type ParsedLead } from "@/lib/parse";
import { loadCsv, loadExistingEmails, importCsvToLeads } from "@/lib/sheet-import";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const mode = body.mode || "preview";

  const loaded = await loadCsv(body);
  if ("error" in loaded) return Response.json({ error: loaded.error }, { status: 400 });

  if (mode === "preview") {
    const { leads: parsed, mapping } = csvToLeads(loaded.csv);
    const valid = parsed.filter((l) => l.company);
    const existingEmails = await loadExistingEmails();
    const seen = new Set<string>();
    let newCount = 0, dupCount = 0, invalidCount = 0;
    const sample: Array<{ lead: ParsedLead; status: string }> = [];
    for (const l of valid) {
      let status = "new";
      if (l.email && !isValidEmail(l.email)) { status = "invalid"; invalidCount++; }
      else {
        const key = (l.email || l.company + "|" + (l.contactName || "")).toLowerCase();
        if (seen.has(key) || (l.email && existingEmails.has(l.email.toLowerCase()))) { status = "duplicate"; dupCount++; }
        else { seen.add(key); newCount++; }
      }
      if (sample.length < 50) sample.push({ lead: l, status });
    }
    return Response.json({ mode, source: loaded.source, mapping, total: valid.length, newCount, dupCount, invalidCount, sample });
  }

  const result = await importCsvToLeads(loaded.csv, loaded.source, body.fileName);
  return Response.json({ mode, ...result });
}

// Allow forcing a fresh re-sync (used by the "Refresh operational data" action).
export async function DELETE() {
  await db.delete(leads).where(eq(leads.orgId, ORG_ID));
  return Response.json({ ok: true });
}
