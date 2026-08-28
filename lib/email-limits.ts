import { db } from "@/db";
import { messages } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const EMAIL_DAILY_MIN_TARGET = 400;
export const EMAIL_DAILY_MAX_LIMIT = 1500;

export function normalizeDailyLimit(input?: number | null): number {
  const n = Number(input || EMAIL_DAILY_MIN_TARGET);
  if (!Number.isFinite(n)) return EMAIL_DAILY_MIN_TARGET;
  return Math.max(EMAIL_DAILY_MIN_TARGET, Math.min(EMAIL_DAILY_MAX_LIMIT, Math.round(n)));
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function sentTodayCount(): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.orgId, ORG_ID), eq(messages.channel, "email"), eq(messages.status, "sent"), gte(messages.sentAt, startOfToday())));
  return Number(row?.c || 0);
}

export async function quotaStatus(requestedDailyLimit?: number | null) {
  const dailyLimit = normalizeDailyLimit(requestedDailyLimit);
  const sentToday = await sentTodayCount();
  return {
    minTarget: EMAIL_DAILY_MIN_TARGET,
    maxLimit: EMAIL_DAILY_MAX_LIMIT,
    dailyLimit,
    sentToday,
    remainingToday: Math.max(0, dailyLimit - sentToday),
    targetRemaining: Math.max(0, EMAIL_DAILY_MIN_TARGET - sentToday),
  };
}
