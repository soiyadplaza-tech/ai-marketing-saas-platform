import { getDailyRow, saveDailyRow, todayKey, DAILY_MIN, DAILY_MAX } from "@/lib/daily-config";
import { normalizeDailyLimit } from "@/lib/email-limits";
import { runAutopilot } from "@/lib/auto-outreach";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// External-cron endpoint. Point a free cron (cron-job.org, Google Apps Script
// time-driven trigger, etc.) at this URL and the AI runs the full pipeline:
// audit fresh leads → score → generate → auto-approve → send, once per window.
//
//   GET  /api/cron/autopilot              (simple, for cron-job.org)
//   POST /api/cron/autopilot?force=1      (force a run)
//
// Security: if CRON_SECRET is set in env, calls must include it as ?token= or
// header "x-cron-token". Without it the endpoint is open (demo) but still rate
// limited to one run per minGap window so it cannot be spammed.

const MIN_GAP_HOURS = 6;

function tokenOk(req: Request, url: URL): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // open (demo) — still rate limited below
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization") || "";
  const provided =
    auth.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("token") ||
    req.headers.get("x-cron-token");
  return provided === secret;
}

async function handler(req: Request) {
  const url = new URL(req.url);
  const started = Date.now();

  if (!tokenOk(req, url)) {
    return Response.json({ ok: false, error: "invalid_token", message: "CRON_SECRET mismatch. Add the correct ?token= or x-cron-token header." }, { status: 401 });
  }

  const row = await getDailyRow();
  const cfg = { ...((row.config as any) || {}) };
  const target = normalizeDailyLimit(cfg.target);
  const batch = Math.max(10, Math.min(200, Number(cfg.batch) || 50));
  // Vercel free tier caps requests at ~10s — keep the live-audit batch small.
  const auditBatch = process.env.VERCEL
    ? Math.min(3, Math.max(0, Number(cfg.auditBatch) || 3))
    : Math.max(0, Math.min(50, Number(cfg.auditBatch) || 15));
  const force = url.searchParams.get("force") === "1" || (await req.json().catch(() => ({})))?.force === true;

  // Rate limit: avoid accidental repeated runs within the gap window.
  const last = row.lastRunAt ? new Date(row.lastRunAt).getTime() : 0;
  const elapsed = Date.now() - last;
  if (!force && row.enabled && elapsed < MIN_GAP_HOURS * 3600 * 1000) {
    const inHours = (elapsed / 3600 / 1000).toFixed(1);
    return Response.json({ ok: true, skipped: "recent_run", message: `Already ran ${inHours}h ago. Next auto-run allowed after ${MIN_GAP_HOURS}h (or use force=1).` });
  }

  const result = await runAutopilot(target, batch, auditBatch);
  cfg.lastRunDate = todayKey();
  await saveDailyRow(row.id, cfg, { lastRunAt: new Date(), runCount: (row.runCount || 0) + 1 });

  return Response.json({
    ok: true,
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    ...result,
    target,
    batch,
    auditBatch,
    message: `Autopilot complete: ${result.audited} leads audited, ${result.generated} emails written, ${result.approved} auto-approved, ${result.sent} sent (provider: ${result.provider}).`,
  });
}

export async function GET(req: Request) {
  return handler(req);
}
export async function POST(req: Request) {
  return handler(req);
}
