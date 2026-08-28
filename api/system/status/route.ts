import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { leads, messages, files, aiJobs } from "@/db/schema";
import { eq, sql, count, desc } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { configuredProvider, defaultFrom } from "@/lib/mailer";
import { quotaStatus } from "@/lib/email-limits";
import { pingBase44, base44Configured } from "@/lib/base44";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  await ensureSchema();
  const [leadCount] = await db.select({ c: count() }).from(leads).where(eq(leads.orgId, ORG_ID));
  const sources = await db.select({ source: leads.source, c: count() }).from(leads).where(eq(leads.orgId, ORG_ID)).groupBy(leads.source);
  const [drafts] = await db.select({ c: count() }).from(messages).where(eq(messages.status, "draft"));
  const [approved] = await db.select({ c: count() }).from(messages).where(eq(messages.status, "approved"));
  const [sent] = await db.select({ c: count() }).from(messages).where(eq(messages.status, "sent"));
  const recentFiles = await db.select().from(files).where(eq(files.orgId, ORG_ID)).orderBy(desc(files.createdAt)).limit(5);
  const recentJobs = await db.select().from(aiJobs).where(eq(aiJobs.orgId, ORG_ID)).orderBy(desc(aiJobs.createdAt)).limit(5);
  const dbPing = await db.execute(sql`select now() as now`);
  const dbNow = (dbPing.rows?.[0] as { now?: string | Date } | undefined)?.now;
  const b44 = base44Configured() ? await pingBase44() : { ok: false, error: "not configured" };

  return Response.json({
    ok: true,
    latencyMs: Date.now() - started,
    database: { ok: true, now: dbNow },
    schema: { ok: true, tablesReady: true },
    leads: { total: Number(leadCount.c), sources: Object.fromEntries(sources.map((s) => [s.source || "unknown", Number(s.c)])) },
    outreach: { drafts: Number(drafts.c), approved: Number(approved.c), sent: Number(sent.c), provider: configuredProvider(), from: defaultFrom(), quota: await quotaStatus() },
    integrations: { sheetUrlConfigured: !!process.env.SHEET_IMPORT_URL, base44: b44, resend: !!process.env.RESEND_API_KEY, smtp: !!process.env.SMTP_HOST, sendgrid: !!process.env.SENDGRID_API_KEY, domain: process.env.APP_BASE_URL || "https://foysalit.com" },
    recentFiles,
    recentJobs,
  });
}
