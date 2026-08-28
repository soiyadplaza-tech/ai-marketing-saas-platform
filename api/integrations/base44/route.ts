import { db } from "@/db";
import { leads, files } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { ORG_ID, logActivity, notify } from "@/lib/repo";
import { base44Configured, fetchBase44Leads, mapBase44Lead, pingBase44 } from "@/lib/base44";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET: connection status + available record count (preview)
export async function GET() {
  if (!base44Configured()) {
    return Response.json({ configured: false, status: "disconnected" });
  }
  const ping = await pingBase44();
  if (!ping.ok) {
    return Response.json({ configured: true, status: "error", error: ping.error });
  }
  try {
    const rows = await fetchBase44Leads(1000);
    return Response.json({
      configured: true,
      status: "connected",
      appName: ping.name,
      available: rows.length,
      sample: rows.slice(0, 10).map(mapBase44Lead),
    });
  } catch (e) {
    return Response.json({ configured: true, status: "error", error: e instanceof Error ? e.message : "Failed" });
  }
}

// POST: import (upsert) all master leads from Base44 into our database.
export async function POST() {
  if (!base44Configured()) {
    return Response.json({ error: "integration_required", message: "Base44 credentials are not configured." }, { status: 409 });
  }
  let rows;
  try {
    rows = await fetchBase44Leads(1000);
  } catch (e) {
    return Response.json({ error: "fetch_failed", message: e instanceof Error ? e.message : "Failed" }, { status: 502 });
  }

  let inserted = 0;
  let updated = 0;
  let priority = 0;

  for (const raw of rows) {
    const m = mapBase44Lead(raw);
    // dedup by email or website
    const checks = [];
    if (m.email) checks.push(eq(leads.email, m.email));
    if (m.website) checks.push(eq(leads.website, m.website));
    let existing: { id: number } | undefined;
    if (checks.length) {
      const found = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.orgId, ORG_ID), or(...checks))).limit(1);
      existing = found[0];
    }

    const values = {
      orgId: ORG_ID,
      company: m.company,
      contactName: m.contactName,
      email: m.email,
      phone: m.phone,
      whatsapp: m.whatsapp,
      website: m.website,
      industry: m.industry,
      location: m.location,
      socialProfiles: m.socialProfiles,
      source: "base44",
      leadScore: m.leadScore,
      scoreCategory: m.scoreCategory,
      websiteScore: m.websiteScore,
      seoScore: m.seoScore,
      localSeoScore: m.localSeoScore,
      socialScore: m.socialScore,
      recommendedServices: m.recommendedServices,
      tags: m.tags,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.update(leads).set(values).where(eq(leads.id, existing.id));
      updated++;
    } else {
      await db.insert(leads).values({ ...values, status: "new_lead", stage: "new_lead" });
      inserted++;
    }
    if (m.scoreCategory === "priority") priority++;
  }

  await db.insert(files).values({
    orgId: ORG_ID,
    name: "Base44 DataSheet Hub — master leads",
    fileType: "base44",
    status: "completed",
    aiStatus: "completed",
    recordsFound: inserted + updated,
    extracted: { inserted, updated },
  });

  await logActivity("imported", `Base44 master import: ${inserted} new, ${updated} updated`);
  await notify("import_complete", "Base44 import completed", `${inserted} new leads, ${updated} updated from DataSheet Hub`);
  if (priority) await notify("priority_lead", "Priority leads imported", `${priority} priority leads from Base44`);

  return Response.json({ ok: true, inserted, updated, total: rows.length });
}
