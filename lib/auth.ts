import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const COOKIE_NAME = "fidm_sid";
const SECRET = process.env.AUTH_SECRET || "foysal-it-dev-secret-2026";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string, salt?: string): string {
  const s = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return check.length === expected.length && timingSafeEqual(check, expected);
}

function hmac(payload: string): string {
  return createHash("sha256").update(payload + SECRET).digest("hex");
}

export function createSessionToken(uid: number, email: string): string {
  const payload = Buffer.from(JSON.stringify({ uid, email, exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  return `${payload}.${hmac(payload)}`;
}

export function parseSessionToken(token?: string | null): { uid: number; email: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (hmac(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.uid || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { uid: data.uid, email: data.email };
  } catch {
    return null;
  }
}

export async function sessionUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const s = parseSessionToken(token);
  if (!s) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.uid)).limit(1);
  if (!u || !u.active) return null;
  return u;
}

// The org scope for the current session.
//   • super_admin (the platform owner) → the main workspace (ORG_ID)
//   • member                           → their own isolated workspace
//   • no session (cron/API)            → the main workspace (ORG_ID)
export async function sessionOrgId(): Promise<number> {
  try {
    const u = await sessionUser();
    if (!u) return ORG_ID;
    if (u.role === "super_admin") return ORG_ID;
    return u.orgId;
  } catch {
    return ORG_ID;
  }
}

// Is the current user the platform owner/admin?
export async function isPlatformAdmin(): Promise<boolean> {
  try {
    const u = await sessionUser();
    return !!u && (u.role === "super_admin" || u.email === PLATFORM_ADMIN_EMAIL);
  } catch {
    return false;
  }
}

// Data-scoping for multi-tenancy:
//   • Owner/admin  -> sees ALL orgs (owner=true -> caller applies no org filter)
//   • Member       -> sees ONLY their own org (orgId)
//   • No session   -> authenticated=false (routes should reject with 401)
export async function currentDataScope(): Promise<{ owner: boolean; orgId: number; authenticated: boolean }> {
  try {
    const u = await sessionUser();
    if (!u) return { owner: false, orgId: ORG_ID, authenticated: false };
    if (u.role === "super_admin" || u.email === PLATFORM_ADMIN_EMAIL) return { owner: true, orgId: ORG_ID, authenticated: true };
    return { owner: false, orgId: u.orgId, authenticated: true };
  } catch {
    return { owner: false, orgId: ORG_ID, authenticated: false };
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" ? false : false,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export const DEMO_ADMIN = { email: "admin@foysalit.com", password: "foysal@2026" };

// The personal platform owner/admin. This email is always super_admin.
export const PLATFORM_ADMIN_EMAIL = "foysalimran890098@gmail.com";

// Role for a new registration: the owner email is super_admin, everyone else is a member.
export function roleForEmail(email: string): "super_admin" | "member" {
  return String(email || "").toLowerCase().trim() === PLATFORM_ADMIN_EMAIL ? "super_admin" : "member";
}

// Ensure an org + admin account exists (idempotent, safe to call on any request).
export async function ensureAdminUser() {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, ORG_ID)).limit(1);
  if (!org) await db.insert(organizations).values({ id: ORG_ID, name: "FOYSAL IT" });

  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_ADMIN.email)).limit(1);
  if (existing) {
    if (!existing.passwordHash) {
      await db.update(users).set({ passwordHash: hashPassword(DEMO_ADMIN.password) }).where(eq(users.id, existing.id));
    }
    return existing;
  }
  // Stable id=1 across DB resets so previously issued sessions keep working.
  try {
    const [created] = await db
      .insert(users)
      .values({ id: 1, orgId: ORG_ID, name: "Foysal Ahmed", email: DEMO_ADMIN.email, role: "super_admin", passwordHash: hashPassword(DEMO_ADMIN.password) })
      .returning();
    return created;
  } catch {
    const [created] = await db
      .insert(users)
      .values({ orgId: ORG_ID, name: "Foysal Ahmed", email: DEMO_ADMIN.email, role: "super_admin", passwordHash: hashPassword(DEMO_ADMIN.password) })
      .returning();
    return created;
  }
}

// Ensure the personal platform admin (foysalimran890098@gmail.com) exists as
// super_admin. Called on any request so the owner always has access.
export async function ensurePlatformAdmin() {
  const email = PLATFORM_ADMIN_EMAIL;
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    // Upgrade to super_admin + main workspace if it was registered as a member.
    if (existing.role !== "super_admin" || existing.orgId !== ORG_ID) {
      await db.update(users).set({ role: "super_admin", orgId: ORG_ID }).where(eq(users.id, existing.id));
      return { ...existing, role: "super_admin" as const, orgId: ORG_ID };
    }
    return existing;
  }
  const [created] = await db
    .insert(users)
    .values({ orgId: ORG_ID, name: "Foysal (Owner)", email, role: "super_admin", passwordHash: hashPassword("foysal@2026") })
    .returning();
  return created;
}
