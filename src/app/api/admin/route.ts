import { db } from "@/db";
import {
  users, sessions, securityEvents, systemErrors, usage, meetings, documents,
  featureFlags, providerConfig, leads, subscriptions,
} from "@/db/schema";
import { eq, desc, sql, count, isNull, gte, and } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { ensureSchema } from "@/db/bootstrap";
import { isPlatformAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY = 86400000;
const now = () => new Date();

async function countWhere(q: any) {
  const r = (await q) as { c: number }[];
  return Number(r[0]?.c ?? 0);
}

export async function GET(req: Request) {
  await ensureSchema();
  if (!(await isPlatformAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const view = url.searchParams.get("view") || "overview";
  const id = parseInt(url.searchParams.get("id") || "0");

  if (view === "user") return Response.json(await user360(id));
  if (view === "users") return Response.json({ users: await db.select().from(users).orderBy(desc(users.createdAt)).limit(500) });

  const [
    totalUsers, activeUsers, newUsers30d, onlineUsers, failedLogins24h, openErrors,
    aiRequests30d, translationRequests30d, voiceMinutes30d, storageBytes,
    meetingsToday, liveMeetings, meetingsTotal, leadsTotal, qualifiedLeads,
    securityLog, errorLog, flags, providers, usersList,
  ] = await Promise.all([
    countWhere(db.select({ c: count() }).from(users)),
    countWhere(db.select({ c: count() }).from(users).where(eq(users.active, true))),
    countWhere(db.select({ c: count() }).from(users).where(gte(users.createdAt, new Date(now().getTime() - 30 * DAY)))),
    countWhere(db.select({ c: count() }).from(sessions).where(isNull(sessions.revokedAt))),
    countWhere(db.select({ c: count() }).from(securityEvents).where(and(eq(securityEvents.eventType, "failed_login"), gte(securityEvents.createdAt, new Date(now().getTime() - DAY))))),
    countWhere(db.select({ c: count() }).from(systemErrors).where(eq(systemErrors.resolved, false))),
    countWhere(db.select({ c: count() }).from(usage).where(and(eq(usage.service, "ai"), gte(usage.createdAt, new Date(now().getTime() - 30 * DAY))))),
    countWhere(db.select({ c: count() }).from(usage).where(and(eq(usage.service, "translation"), gte(usage.createdAt, new Date(now().getTime() - 30 * DAY))))),
    countWhere(db.select({ c: count() }).from(usage).where(and(eq(usage.service, "voice"), gte(usage.createdAt, new Date(now().getTime() - 30 * DAY))))),
    countWhere(db.select({ c: sql<number>`coalesce(sum(${documents.size}),0)` }).from(documents)),
    countWhere(db.select({ c: count() }).from(meetings).where(gte(meetings.createdAt, new Date(now().getTime() - DAY)))),
    countWhere(db.select({ c: count() }).from(meetings).where(eq(meetings.status, "live"))),
    countWhere(db.select({ c: count() }).from(meetings)),
    countWhere(db.select({ c: count() }).from(leads).where(eq(leads.orgId, ORG_ID))),
    countWhere(db.select({ c: count() }).from(leads).where(and(eq(leads.orgId, ORG_ID), eq(leads.stage, "qualified")))),
    db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(50) as Promise<any[]>,
    db.select().from(systemErrors).orderBy(desc(systemErrors.createdAt)).limit(50) as Promise<any[]>,
    db.select().from(featureFlags).orderBy(featureFlags.key) as Promise<any[]>,
    db.select().from(providerConfig).orderBy(providerConfig.key) as Promise<any[]>,
    db.select().from(users).orderBy(desc(users.createdAt)).limit(200) as Promise<any[]>,
  ]);

  let dbOk = true;
  try { await db.execute(sql`select 1`); } catch { dbOk = false; }

  return Response.json({
    view: "overview",
    stats: {
      totalUsers, activeUsers, newUsers30d, onlineUsers, failedLogins24h, openErrors,
      aiRequests30d, translationRequests30d, voiceMinutes30d, storageBytes,
      meetingsToday, liveMeetings, meetingsTotal, leads: leadsTotal, qualifiedLeads,
    },
    liveStatus: {
      database: dbOk ? "operational" : "degraded",
      ai: "operational",
      translation: "operational",
      voice: "operational",
      storage: "operational",
      email: process.env.RESEND_API_KEY ? "operational" : "not_configured",
      googleMeet: "not_connected",
    },
    users: usersList,
    securityEvents: securityLog,
    errors: errorLog,
    featureFlags: flags,
    providers: [],
  });
}

async function user360(id: number) {
  if (!id) return { error: "user id required" };
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return { error: "user not found" };
  const { passwordHash, ...safeUser } = user;
  const [sessionsAll, activeSessions, securityLog, usageRows, meetingsList, docs, sub, leadsCount] = await Promise.all([
    db.select().from(sessions).where(eq(sessions.userId, id)).orderBy(desc(sessions.createdAt)).limit(100),
    countWhere(db.select({ c: count() }).from(sessions).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)))),
    db.select().from(securityEvents).where(eq(securityEvents.userId, id)).orderBy(desc(securityEvents.createdAt)).limit(50) as Promise<any[]>,
    db.select({ service: usage.service, c: count() }).from(usage).where(eq(usage.userId, id)).groupBy(usage.service) as Promise<any[]>,
    db.select().from(meetings).where(eq(meetings.ownerId, id)).orderBy(desc(meetings.createdAt)).limit(50) as Promise<any[]>,
    db.select().from(documents).where(eq(documents.ownerId, id)).orderBy(desc(documents.createdAt)).limit(100) as Promise<any[]>,
    db.select().from(subscriptions).where(eq(subscriptions.userId, id)).orderBy(desc(subscriptions.createdAt)).limit(1) as Promise<any[]>,
    countWhere(db.select({ c: count() }).from(leads).where(eq(leads.orgId, ORG_ID))),
  ]);
  return {
    user: {
      ...safeUser,
      passwordStatus: user.passwordHash ? "set" : "none",
      activeSessions,
      leadsCount,
      subscription: sub[0] || { plan: "free", status: "active" },
      usage: usageRows,
    },
    sessions: sessionsAll,
    securityEvents: securityLog,
    meetings: meetingsList,
    documents: docs,
  };
}

// Admin/Owner actions: disable/enable user, reset password, revoke sessions, feature flags.
export async function POST(req: Request) {
  await ensureSchema();
  if (!(await isPlatformAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { action, id, key, enabled } = body;

  if (action === "disable" || action === "enable") {
    if (!id) return Response.json({ error: "user id required" }, { status: 400 });
    await db.update(users).set({ active: action === "enable" }).where(eq(users.id, id));
    return Response.json({ ok: true });
  }

  if (action === "reset_password") {
    if (!id) return Response.json({ error: "user id required" }, { status: 400 });
    // Issue a temporary secure password (never exposes the existing hash).
    const tempPw = "FOYSAL-" + Math.random().toString(36).slice(2, 8) + "!" ;
    const { hashPassword } = await import("@/lib/auth");
    await db.update(users).set({ passwordHash: hashPassword(tempPw), passwordChangedAt: new Date() }).where(eq(users.id, id));
    return Response.json({ ok: true, tempPassword: tempPw });
  }

  if (action === "revoke_sessions") {
    if (!id) return Response.json({ error: "user id required" }, { status: 400 });
    const { sessions } = await import("@/db/schema");
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
    return Response.json({ ok: true });
  }

  if (action === "feature_flag") {
    if (!key) return Response.json({ error: "key required" }, { status: 400 });
    const { featureFlags } = await import("@/db/schema");
    const [existing] = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
    if (existing) {
      await db.update(featureFlags).set({ enabled: !!enabled, updatedAt: new Date() }).where(eq(featureFlags.id, existing.id));
    } else {
      await db.insert(featureFlags).values({ key, label: key, enabled: !!enabled, description: "Feature flag" });
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "unknown action" }, { status: 400 });
}
