import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { resolveDatabaseUrl } from "./conn";

// Resolves the database URL with the correct precedence (production env var wins;
// the dev sandbox transparently uses the persistent Neon DB). See ./conn.ts.
const databaseUrl = resolveDatabaseUrl();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
