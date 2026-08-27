import { db } from "@/db";
import { activities, notifications, aiJobs } from "@/db/schema";

export const ORG_ID = 1;

export async function logActivity(
  type: string,
  message: string,
  leadId?: number | null,
  meta: Record<string, unknown> = {}
) {
  try {
    await db.insert(activities).values({ orgId: ORG_ID, type, message, leadId: leadId ?? null, meta });
  } catch {
    /* non-fatal */
  }
}

export async function notify(
  type: string,
  title: string,
  body?: string,
  leadId?: number | null
) {
  try {
    await db.insert(notifications).values({ orgId: ORG_ID, type, title, body: body ?? null, leadId: leadId ?? null });
  } catch {
    /* non-fatal */
  }
}

export async function recordJob(
  type: string,
  label: string,
  status: "completed" | "failed" | "processing",
  durationMs: number,
  leadId?: number | null,
  result: Record<string, unknown> = {},
  error?: string
) {
  try {
    await db.insert(aiJobs).values({
      orgId: ORG_ID,
      type,
      label,
      status,
      durationMs,
      leadId: leadId ?? null,
      result,
      error: error ?? null,
    });
  } catch {
    /* non-fatal */
  }
}
