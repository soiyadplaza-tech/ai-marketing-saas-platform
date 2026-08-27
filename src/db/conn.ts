// Database connection resolver.
//
// Precedence:
//   1. APP_DATABASE_URL  — explicit override (set in Vercel env for production)
//   2. DATABASE_URL      — the platform-injected database (sandbox local / Vercel)
//
// SECURITY: no database credentials are hardcoded in source code. The
// production (Neon) connection string is supplied via the DATABASE_URL /
// APP_DATABASE_URL environment variable in the deployment's secret store
// (see VERCEL_DEPLOY.md). The dev sandbox uses the platform's local database
// and auto-reimports the master Google Sheet on startup, so no secret is
// ever baked into the build output.

export function resolveDatabaseUrl(): string {
  return process.env.APP_DATABASE_URL || process.env.DATABASE_URL || "";
}
