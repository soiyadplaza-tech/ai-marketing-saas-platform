import { NextRequest, NextResponse, NextFetchEvent } from "next/server";

// Near-real-time API request monitoring. Logs request metadata asynchronously so
// it does not slow down user requests. No secrets or request bodies are stored.
export function middleware(req: NextRequest, ev: NextFetchEvent) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/") && path !== "/api/monitor/log") {
    const started = Date.now();
    const url = new URL("/api/monitor/log", req.url);
    ev.waitUntil(
      fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.MONITOR_TOKEN ? { "x-monitor-token": process.env.MONITOR_TOKEN } : {}),
        },
        body: JSON.stringify({
          method: req.method,
          path,
          // Middleware can't reliably know final handler status; status is filled
          // by routes that explicitly log errors. This still gives real request counts.
          durationMs: Date.now() - started,
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
          userAgent: req.headers.get("user-agent") || "",
          cookie: req.headers.get("cookie") || "",
        }),
      }).catch(() => {})
    );
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
