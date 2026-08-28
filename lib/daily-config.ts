import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { automations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const DAILY_TRIGGER = "daily_outreach";
export const DAILY_MIN = 400;
export const DAILY_MAX = 1500;

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyRow() {
  await ensureSchema();
  const [row] = await db.select().from(automations).where(eq(automations.trigger, DAILY_TRIGGER)).limit(1);
  if (row) return row;
  const [created] = await db
    .insert(automations)
    .values({
      orgId: ORG_ID,
      name: "Daily AI Auto-Outreach",
      trigger: DAILY_TRIGGER,
      enabled: false,
      steps: [{ type: "trigger", label: "Every day (auto)" }],
      config: { target: 500, batch: 50, auditBatch: 15 },
    })
    .returning();
  return created;
}

export async function saveDailyRow(id: number, cfg: Record<string, unknown>, patch?: { lastRunAt?: Date; runCount?: number }) {
  await db
    .update(automations)
    .set({ config: cfg, ...(patch ? { lastRunAt: patch.lastRunAt, runCount: patch.runCount } : {}) })
    .where(eq(automations.id, id));
}
