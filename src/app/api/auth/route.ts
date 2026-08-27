import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { users, organizations, passwordResetTokens, securityEvents, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { hashPassword, verifyPassword, createSessionToken, ensureAdminUser, ensurePlatformAdmin, sessionUser, roleForEmail, COOKIE_NAME } from "@/lib/auth";
import { configuredProvider, sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const validRole = (r?: string) => (r && ["viewer", "sales", "marketing", "auditor", "manager", "admin", "super_admin"].includes(r) ? r : "sales");
const validEmail = (e?: string) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function resetLink(token: string, origin?: string) {
  const base = process.env.APP_BASE_URL || origin || "";
  return `${base}/reset-password?token=${token}`;
}

async function issueSession(req: Request, user: { id: number; email: string }) {
  const token = createSessionToken(user.id, user.email);
  await db.insert(sessions).values({
    userId: user.id,
    token,
    ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
    userAgent: req.headers.get("user-agent") || "",
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  }).catch(() => {});
  return token;
}

export async function GET() {
  await ensureSchema();
  const u = await sessionUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json({ user: { id: u.id, orgId: u.orgId, name: u.name, email: u.email, role: u.role, active: u.active, createdAt: u.createdAt, phone: u.phone, country: u.country, language: u.language, company: u.company, jobTitle: u.jobTitle, profilePhoto: u.profilePhoto, facebook: u.facebook, linkedin: u.linkedin, fiverrProfile: u.fiverrProfile, upworkProfile: u.upworkProfile, portfolio: u.portfolio, website: u.website } });
}

export async function POST(req: Request) {
  await ensureSchema();
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "login") {
    await ensureAdminUser();
    await ensurePlatformAdmin();
    if (!validEmail(body.email) || !body.password) return Response.json({ error: "Enter your email and password." }, { status: 400 });
    const email = String(body.email).toLowerCase();
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!u || !verifyPassword(String(body.password), u.passwordHash)) {
      await db.insert(securityEvents).values({ userId: u?.id ?? null, eventType: "failed_login", actorName: email, detail: "Invalid credentials", status: "blocked" }).catch(() => {});
      return Response.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, u.id)).catch(() => {});
    await db.insert(securityEvents).values({ userId: u.id, eventType: "login", actorName: u.email, detail: "Successful login", status: "ok" }).catch(() => {});
    const token = await issueSession(req, u);
    const res = NextResponse.json({ ok: true, user: { id: u.id, orgId: u.orgId, name: u.name, email: u.email, role: u.role } });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 24 * 3600 });
    return res;
  }

  if (action === "register") {
    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    if (name.length < 2) return Response.json({ error: "Please enter your full name." }, { status: 400 });
    if (!validEmail(email)) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (String(body.password || "").length < 6) return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (dup) return Response.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });

    // Multi-tenant: the owner email becomes super_admin (main workspace);
    // everyone else becomes a member with their own isolated workspace (org).
    const role = roleForEmail(email);
    let orgId = ORG_ID;
    if (role !== "super_admin") {
      const [org] = await db
        .insert(organizations)
        .values({ name: `${name}'s Workspace` })
        .returning();
      orgId = org.id;
    }
    const [u] = await db
      .insert(users)
      .values({ orgId, name, email, role, passwordHash: hashPassword(String(body.password)) })
      .returning();
    const token = await issueSession(req, u);
    const res = NextResponse.json({ ok: true, user: { id: u.id, name: u.name, email: u.email, role: u.role, orgId } });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 24 * 3600 });
    return res;
  }

  if (action === "forgot") {
    const email = String(body.email || "").toLowerCase().trim();
    if (!validEmail(email)) return Response.json({ error: "Enter a valid email." }, { status: 400 });
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!u) {
      // Do not reveal whether the account exists.
      return Response.json({ ok: true, message: "If this email is registered, a reset link has been sent.", sent: false });
    }
    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ orgId: ORG_ID, email, token, expiresAt });
    const link = resetLink(token, new URL(req.url).origin);

    if (configuredProvider() !== "none") {
      const result = await sendEmail({
        to: email,
        subject: "FOYSAL IT — Password reset",
        text: `Someone requested a password reset for ${email}.\n\nOpen this link within 1 hour:\n${link}\n\nIf you did not request this, ignore this email.`,
      });
      if (result.ok) return Response.json({ ok: true, message: "Reset link sent. Check your inbox.", sent: true });
      // Provider failed (e.g. unverified domain) — hand the link over honestly.
      return Response.json({ ok: true, sent: false, message: `Email sending failed (${result.error}). Use this one-time reset link instead:`, link });
    }
    return Response.json({ ok: true, sent: false, message: "No email provider connected — use this one-time reset link instead:", link });
  }

  if (action === "reset") {
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!token || password.length < 6) return Response.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    const [t] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    if (!t || t.used || t.expiresAt < new Date()) return Response.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
    const [u] = await db.select().from(users).where(eq(users.email, t.email)).limit(1);
    if (!u) return Response.json({ error: "Account not found." }, { status: 404 });
    await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, u.id));
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, t.id));
    return Response.json({ ok: true, message: "Password updated. You can now log in." });
  }

  if (action === "change") {
    const u = await sessionUser();
    if (!u) return Response.json({ error: "Login required." }, { status: 401 });
    if (!verifyPassword(String(body.current || ""), u.passwordHash)) return Response.json({ error: "Current password is incorrect." }, { status: 400 });
    if (String(body.next || "").length < 6) return Response.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    await db.update(users).set({ passwordHash: hashPassword(String(body.next)) }).where(eq(users.id, u.id));
    return Response.json({ ok: true, message: "Password changed." });
  }

  if (action === "logout") {
    const token = req.headers.get("cookie")?.split(";").map((p) => p.trim()).find((p) => p.startsWith(COOKIE_NAME + "="))?.split("=").slice(1).join("=");
    if (token) await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.token, decodeURIComponent(token))).catch(() => {});
    const u = await sessionUser().catch(() => null);
    if (u) await db.insert(securityEvents).values({ userId: u.id, eventType: "logout", actorName: u.email, detail: "User logged out" }).catch(() => {});
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  }

  if (action === "profiles") {
    const u = await sessionUser();
    if (!u) return Response.json({ error: "Login required." }, { status: 401 });
    await db.update(users).set({ fiverrProfile: body.fiverr || null, upworkProfile: body.upwork || null }).where(eq(users.id, u.id));
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
