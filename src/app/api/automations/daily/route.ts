import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { automations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { quotaStatus, normalizeDailyLimit } from "@/lib/email-limits";
import { runAutopilot } from "@/lib/auto-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TRIGGER = "daily_outreach";
const DAILY_MIN = 400;
const DAILY_MAX = 1500;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getRow() {
  const [row] = await db.select().from(automations).where(eq(automations.trigger, TRIGGER)).limit(1);
  if (row) return row;
  const [created] = await db
    .insert(automations)
    .values({ orgId: ORG_ID, name: "Daily AI Auto-Outreach", trigger: TRIGGER, enabled: false, steps: [{ type: "trigger", label: "Every day (auto)" }], config: { target: 500, batch: 50 } })
    .returning();
  return created;
}

export async function GET() {
  await ensureSchema();
  const row = await getRow();
  const cfg = (row.config as any) || {};
  const quota = await quotaStatus(Number(cfg.target) || 500);
  return Response.json({
    enabled: row.enabled,
    target: Number(cfg.target) || 500,
    batch: Number(cfg.batch) || 50,
    lastRunAt: row.lastRunAt,
    ranToday: (row.config as any)?.lastRunDate === todayKey(),
    min: DAILY_MIN,
    max: DAILY_MAX,
    quota,
    runCount: row.runCount,
  });
}

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const action = body.action || "status";
  const row = await getRow();
  const cfg = { ...((row.config as any) || {}) };

  if (action === "config") {
    if (body.target != null) cfg.target = Math.max(DAILY_MIN, Math.min(DAILY_MAX, Number(body.target) || 500));
    if (body.batch != null) cfg.batch = Math.max(10, Math.min(200, Number(body.batch) || 50));
    if (typeof body.enabled === "boolean") {
      await db.update(automations).set({ enabled: body.enabled, config: cfg }).where(eq(automations.id, row.id));
      return Response.json({ ok: true, enabled: body.enabled });
    }
    await db.update(automations).set({ config: cfg }).where(eq(automations.id, row.id));
    return Response.json({ ok: true });
  }

  const target = normalizeDailyLimit(cfg.target);
  // On Vercel's free tier requests cap at ~10s — keep the audit batch small.
  const maxAudit = process.env.VERCEL ? 5 : 50;
  const batch = Math.max(10, Math.min(200, Number(cfg.batch) || 50));
  const auditBatch = Math.max(0, Math.min(maxAudit, Number(cfg.auditBatch) || 15));

  // auto-check: only fires once per day, and only when explicitly enabled.
  if (action === "auto-check") {
    if (!row.enabled) return Response.json({ ok: true, skipped: "disabled" });
    if (cfg.lastRunDate === todayKey()) return Response.json({ ok: true, skipped: "already_ran_today" });
    if ((await quotaStatus(target)).remainingToday <= 0) return Response.json({ ok: true, skipped: "daily_limit_reached" });
    const result = await runAutopilot(target, batch, auditBatch);
    cfg.lastRunDate = todayKey();
    await db.update(automations).set({ config: cfg, lastRunAt: new Date(), runCount: (row.runCount || 0) + 1 }).where(and(eq(automations.id, row.id), eq(automations.orgId, ORG_ID)));
    return Response.json({ ok: true, auto: true, ...result });
  }

  // run: manual trigger (or enabled auto) — full pipeline: audit → draft → approve → send.
  if (action === "run") {
    if (!row.enabled && !body.force) return Response.json({ error: "Enable Daily Auto Outreach first, or send force:true." }, { status: 409 });
    const result = await runAutopilot(target, batch, auditBatch);
    cfg.lastRunDate = todayKey();
    await db.update(automations).set({ config: cfg, lastRunAt: new Date(), runCount: (row.runCount || 0) + 1 }).where(eq(automations.id, row.id));
    return Response.json({ ok: true, ...result });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
