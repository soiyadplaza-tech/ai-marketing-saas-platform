// Real Gmail integration — Google OAuth 2.0 + Gmail API v1.
// All tokens are encrypted at rest (AES-256-GCM) and only ever used
// server-side. Nothing sensitive is returned to the frontend.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import { gmailAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify", // read + mark read
  "https://www.googleapis.com/auth/gmail.send", // send mail
];

export function gmailConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return (process.env.GOOGLE_REDIRECT_URI || `${origin.replace(/\/$/, "")}/api/gmail/callback`).replace(/^http:\/\//, (u) => u);
}

// ---------- token encryption ----------
function key(): Buffer {
  const secret = process.env.GMAIL_TOKEN_SECRET || "foysal-it-gmail-token-secret-v1";
  return createHash("sha256").update(secret).digest();
}

export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptToken(stored: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = stored.split(".");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

// ---------- account store ----------
async function getActiveAccount() {
  await ensureSchema();
  const [row] = await db
    .select()
    .from(gmailAccounts)
    .where(and(eq(gmailAccounts.orgId, ORG_ID), eq(gmailAccounts.disconnected, false)))
    .limit(1);
  return row || null;
}

export interface GmailStatus {
  configured: boolean;
  connected: boolean;
  accountEmail?: string;
  scopes?: string;
  connectedAt?: string;
  missing?: string[];
}

export async function getStatus(): Promise<GmailStatus> {
  const missing: string[] = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  const row = await getActiveAccount().catch(() => null);
  return {
    configured: gmailConfigured(),
    connected: !!row,
    accountEmail: row?.userEmail,
    scopes: row?.scopes ?? undefined,
    connectedAt: row?.connectedAt ? new Date(row.connectedAt).toISOString() : undefined,
    missing,
  };
}

// ---------- OAuth ----------
export function buildAuthUrl(origin: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: GMAIL_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

async function googleTokenEndpoint(params: Record<string, string>): Promise<Record<string, any>> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      ...params,
    }).toString(),
  });
  return (await res.json().catch(() => ({}))) as Record<string, any>;
}

export async function exchangeCode(code: string, origin: string) {
  const r = await googleTokenEndpoint({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(origin),
  });
  if (!r.access_token) throw new Error(r.error_description || r.error || "Google OAuth token exchange failed");
  return r;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const r = await googleTokenEndpoint({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  if (!r.access_token) throw new Error(r.error_description || r.error || "Token refresh failed");
  return r.access_token;
}

export async function revokeToken(accessToken: string): Promise<void> {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: accessToken }).toString(),
    });
  } catch {
    /* best-effort */
  }
}

// ---------- live access token (auto-refresh) ----------
export async function getAccessToken(): Promise<{ email: string; token: string } | null> {
  const row = await getActiveAccount();
  if (!row) return null;
  let refresh = decryptToken(row.refreshTokenEnc) || "";
  let access = decryptToken(row.accessTokenEnc) || "";

  // Use cached token if it likely still valid; otherwise refresh.
  const lastUsed = row.lastUsedAt ? new Date(row.lastUsedAt).getTime() : 0;
  if (access && Date.now() - lastUsed < 50 * 60 * 1000) {
    return { email: row.userEmail, token: access };
  }
  if (refresh) {
    try {
      access = await refreshAccessToken(refresh);
    } catch {
      if (access) return { email: row.userEmail, token: access };
      throw new Error("Gmail OAuth token expired and refresh failed. Please reconnect Gmail.");
    }
  } else if (!access) {
    throw new Error("Gmail tokens missing. Please reconnect Gmail.");
  }
  await db
    .update(gmailAccounts)
    .set({ accessTokenEnc: encryptToken(access), refreshTokenEnc: encryptToken(refresh || row.refreshTokenEnc), lastUsedAt: new Date() })
    .where(eq(gmailAccounts.id, row.id));
  return { email: row.userEmail, token: access };
}

// ---------- Gmail API ----------
const API = "https://gmail.googleapis.com/gmail/v1";

async function gapi<T = any>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    const msg = data?.error?.message || `Gmail API error (HTTP ${res.status})`;
    const e: any = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return data as T;
}

export async function listMessages(opts: { q?: string; labelIds?: string[]; max?: number; pageToken?: string }) {
  const auth = await getAccessToken();
  if (!auth) throw notConnected();
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.labelIds?.length) params.set("labelIds", opts.labelIds.join(","));
  params.set("maxResults", String(Math.min(50, opts.max || 25)));
  if (opts.pageToken) params.set("pageToken", opts.pageToken);
  return gapi("GET", `/users/me/messages?${params.toString()}`, auth.token);
}

export async function getMessage(id: string) {
  const auth = await getAccessToken();
  if (!auth) throw notConnected();
  return gapi("GET", `/users/me/messages/${encodeURIComponent(id)}?format=full`, auth.token);
}

export async function getThread(id: string) {
  const auth = await getAccessToken();
  if (!auth) throw notConnected();
  return gapi("GET", `/users/me/threads/${encodeURIComponent(id)}?format=full`, auth.token);
}

export async function markRead(messageId: string) {
  const auth = await getAccessToken();
  if (!auth) throw notConnected();
  return gapi("POST", `/users/me/messages/${encodeURIComponent(messageId)}/modify`, auth.token, {
    addLabelIds: ["-UNREAD"],
    removeLabelIds: ["UNREAD"],
  });
}

// Build a proper MIME message and send it through the real Gmail API.
export async function sendMail(opts: {
  to: string;
  subject: string;
  body: string;
  from?: string;
  threadId?: string;
  inReplyTo?: string; // original message id -> In-Reply-To/References
}) {
  const auth = await getAccessToken();
  if (!auth) throw notConnected();

  const headers: string[] = [];
  headers.push(`Date: ${new Date().toUTCString()}`);
  headers.push(`From: ${opts.from || auth.email}`);
  headers.push(`To: ${opts.to}`);
  headers.push(`Subject: ${encodeHeader(opts.subject)}`);
  if (opts.inReplyTo) {
    headers.push(`In-Reply-To: <${opts.inReplyTo}>`);
    headers.push(`References: <${opts.inReplyTo}>`);
  }
  headers.push("MIME-Version: 1.0");
  headers.push("Content-Type: text/plain; charset=UTF-8");
  headers.push("Content-Transfer-Encoding: base64");
  const rawMime = headers.join("\r\n") + "\r\n\r\n" + Buffer.from(opts.body, "utf8").toString("base64");
  const raw = Buffer.from(rawMime, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const payload: any = { raw };
  if (opts.threadId) payload.threadId = opts.threadId;

  const data = await gapi("POST", "/users/me/send", auth.token, payload);
  return { id: data?.id, threadId: data?.threadId };
}

function encodeHeader(s: string): string {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

function notConnected() {
  const e: any = new Error("Gmail is not connected.");
  e.code = "not_connected";
  return e;
}

// ---------- persistence ----------
export async function saveConnectedAccount(email: string, token: any, scopes: string) {
  await ensureSchema();
  // Deactivate previous connections.
  await db.update(gmailAccounts).set({ disconnected: true }).where(and(eq(gmailAccounts.orgId, ORG_ID), eq(gmailAccounts.disconnected, false)));
  await db.insert(gmailAccounts).values({
    orgId: ORG_ID,
    userEmail: email,
    scopes,
    accessTokenEnc: encryptToken(token.access_token),
    refreshTokenEnc: encryptToken(token.refresh_token || ""),
  });
}

export async function disconnect() {
  await ensureSchema();
  const rows = await db
    .select()
    .from(gmailAccounts)
    .where(and(eq(gmailAccounts.orgId, ORG_ID), eq(gmailAccounts.disconnected, false)));
  for (const row of rows) {
    const at = decryptToken(row.accessTokenEnc);
    if (at) await revokeToken(at);
    await db.update(gmailAccounts).set({ disconnected: true }).where(eq(gmailAccounts.id, row.id));
  }
}
