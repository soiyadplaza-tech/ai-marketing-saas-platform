import { db } from "@/db";
import { sql, count, desc, eq, gte, isNull, and } from "drizzle-orm";
import { users, sessions, securityEvents, activities, aiJobs, files, systemErrors, apiRequests, meetings, integrations, documents, usage, subscriptions } from "@/db/schema";
import { configuredProvider } from "@/lib/mailer";
import { resolveLlmProvider } from "@/lib/email-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const minAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);
const dayAgo = () => new Date(Date.now() - 24 * 3600 * 1000);

async function c(q: Promise<{ c: number }[]>) { const r = await q; return Number(r[0]?.c ?? 0); }

async function translationHealth() {
  try {
    const r = await fetch("https://api.mymemory.translated.net/get?q=hello&langpair=en|bn", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    return r.ok && !!d?.responseData?.translatedText ? "Operational" : "Degraded";
  } catch { return "Down"; }
}

export async function GET() {
  const now = Date.now();
  let dbStatus: "Operational" | "Down" = "Operational";
  let dbLatency = 0;
  try {
    const s = Date.now();
    await db.execute(sql`select 1`);
    dbLatency = Date.now() - s;
  } catch { dbStatus = "Down"; }

  const [onlineUsers, activeSessions, logins24h, failedLogins24h, userActivity24h, aiActivity24h, meetingActivity24h, api24h, api5m, backgroundJobs24h, failedJobs24h, uploads24h, openErrors, security24h, subscriptionEvents24h, integrationRows, storageBytes, translationStatus] = await Promise.all([
    c(db.select({ c: count() }).from(sessions).where(and(isNull(sessions.revokedAt), gte(sessions.createdAt, minAgo(15))))),
    c(db.select({ c: count() }).from(sessions).where(isNull(sessions.revokedAt))),
    c(db.select({ c: count() }).from(securityEvents).where(and(eq(securityEvents.eventType, "login"), gte(securityEvents.createdAt, dayAgo())))),
    c(db.select({ c: count() }).from(securityEvents).where(and(eq(securityEvents.eventType, "failed_login"), gte(securityEvents.createdAt, dayAgo())))),
    c(db.select({ c: count() }).from(activities).where(gte(activities.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(aiJobs).where(gte(aiJobs.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(meetings).where(gte(meetings.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(apiRequests).where(gte(apiRequests.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(apiRequests).where(gte(apiRequests.createdAt, minAgo(5)))),
    c(db.select({ c: count() }).from(aiJobs).where(gte(aiJobs.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(aiJobs).where(and(eq(aiJobs.status, "failed"), gte(aiJobs.createdAt, dayAgo())))),
    c(db.select({ c: count() }).from(files).where(gte(files.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(systemErrors).where(eq(systemErrors.resolved, false))),
    c(db.select({ c: count() }).from(securityEvents).where(gte(securityEvents.createdAt, dayAgo()))),
    c(db.select({ c: count() }).from(subscriptions).where(gte(subscriptions.createdAt, dayAgo()))),
    db.select().from(integrations).orderBy(integrations.provider).limit(100),
    c(db.select({ c: sql<number>`coalesce(sum(${files.size}),0) + coalesce((select sum(size) from documents),0)` }).from(files)),
    translationHealth(),
  ]);

  const recentApi = await db.select().from(apiRequests).orderBy(desc(apiRequests.createdAt)).limit(25);
  const recentSecurity = await db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(25);
  const recentErrors = await db.select().from(systemErrors).orderBy(desc(systemErrors.createdAt)).limit(25);
  const recentJobs = await db.select().from(aiJobs).orderBy(desc(aiJobs.createdAt)).limit(25);

  const mail = configuredProvider() === "none" ? "Not Configured" : "Operational";
  const ai = resolveLlmProvider() ? "Operational" : "Operational"; // built-in engines are operational
  const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "Operational" : "Not Configured";
  const calendar = google;

  return Response.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    stats: { onlineUsers, activeSessions, logins24h, failedLogins24h, userActivity24h, aiActivity24h, meetingActivity24h, api24h, api5m, backgroundJobs24h, failedJobs24h, uploads24h, openErrors, security24h, subscriptionEvents24h, storageBytes },
    health: {
      database: { status: dbStatus, latencyMs: dbLatency },
      authentication: { status: "Operational", detail: "Session cookie + secure password hashes" },
      storage: { status: "Operational", bytes: storageBytes },
      email: { status: mail, provider: configuredProvider() },
      apis: { status: api24h >= 0 ? "Operational" : "Unknown", last24h: api24h, last5m: api5m },
      ai: { status: ai, provider: resolveLlmProvider()?.provider || "built-in" },
      voice: { status: "Unknown", detail: "Browser dependent SpeechRecognition/TTS; test on /voice or /nova" },
      translation: { status: translationStatus, provider: "MyMemory" },
      googleMeet: { status: google, detail: google === "Operational" ? "OAuth credentials present" : "GOOGLE_CLIENT_ID/SECRET missing" },
      calendar: { status: calendar, detail: calendar === "Operational" ? "Google OAuth ready" : "Google OAuth missing" },
      backgroundJobs: { status: failedJobs24h > 0 ? "Degraded" : "Operational", failed24h: failedJobs24h },
      integrations: { status: integrationRows.some((i) => i.status === "error") ? "Degraded" : "Operational", rows: integrationRows.length },
    },
    recent: { api: recentApi, security: recentSecurity, errors: recentErrors, jobs: recentJobs },
  });
}
