import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { apiRequests } from "@/db/schema";
import { parseSessionToken, COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

function cookie(header: string | null, name: string): string | null {
  for (const part of (header || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function POST(req: Request) {
  // Only middleware/internal calls should log. If MONITOR_TOKEN is set, enforce it.
  const token = process.env.MONITOR_TOKEN;
  if (token && req.headers.get("x-monitor-token") !== token) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const session = parseSessionToken(cookie(body.cookie || null, COOKIE_NAME));
    await db.insert(apiRequests).values({
      method: String(body.method || "GET").slice(0, 12),
      path: String(body.path || "/").slice(0, 500),
      status: body.status ? Number(body.status) : null,
      durationMs: body.durationMs ? Number(body.durationMs) : null,
      userId: session?.uid ?? null,
      ip: String(body.ip || "").slice(0, 100),
      userAgent: String(body.userAgent || "").slice(0, 500),
    });
  } catch {
    // logging must never break the app
  }
  return Response.json({ ok: true });
}
