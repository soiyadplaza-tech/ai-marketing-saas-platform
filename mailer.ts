// Real email sending. Uses whichever provider is actually configured via
// server-side environment variables. NO fake sends — if nothing is configured
// we return a clear "not configured" result and the caller keeps the message
// in an approved (unsent) state.
//
// Priority: Resend → SendGrid → SMTP (nodemailer).

import nodemailer from "nodemailer";

export type MailProvider = "resend" | "sendgrid" | "smtp" | "none";

// Built-in business sender — survives even if env vars are wiped.
export const BUSINESS_SENDER = "foysalahmed.dm23@gmail.com";

const VALID_FROM = /^"?[^"<>()\s][^"<>()]*"?\s*<[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}>$/;

// Always returns a well-formed "Name <addr>" string — never an invalid format.
export function safeFrom(): string {
  const candidates = [process.env.MAIL_FROM, process.env.SMTP_FROM];
  for (const c of candidates) {
    if (c && VALID_FROM.test(c.trim())) return c.trim();
  }
  return `FOYSAL IT <${BUSINESS_SENDER}>`;
}

// Backwards-compatible alias.
export function defaultFrom(): string {
  return safeFrom();
}

// Backup chain (async — includes DB-stored credentials from the Email Robot
// card): Gmail SMTP first, then Resend, then SendGrid. Every result is real.
export async function providerChain(): Promise<MailProvider[]> {
  const chain: MailProvider[] = [];
  const creds = await getSmtpCredentials();
  if (creds.user && creds.pass) chain.push("smtp");
  if (process.env.RESEND_API_KEY) chain.push("resend");
  if (process.env.SENDGRID_API_KEY) chain.push("sendgrid");
  return chain;
}

// Sync provider hint for status UIs (the real send path uses the async chain).
export function configuredProvider(): MailProvider {
  if (process.env.SMTP_HOST || process.env.GMAIL_USER || process.env.GMAIL_APP_PASSWORD) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  return "none";
}

export interface SendInput {
  to: string;
  subject: string;
  text: string;
  from?: string;
}

export interface SendResult {
  ok: boolean;
  provider: MailProvider;
  id?: string;
  error?: string;
}

function textToHtml(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap">${esc}</div>`;
}

export async function sendEmail(input: SendInput): Promise<SendResult> {
  const chain = await providerChain();
  if (!input.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to)) {
    return { ok: false, provider: chain[0] || "none", error: "Recipient email is missing or invalid." };
  }
  if (chain.length === 0) {
    return { ok: false, provider: "none", error: "No email provider configured. Add GMAIL_USER + app password, RESEND_API_KEY, or SENDGRID_API_KEY." };
  }
  const from = input.from || defaultFrom();
  const errors: string[] = [];
  for (const provider of chain) {
    try {
      const r = await sendVia(provider, input, from);
      if (r.ok) return { ok: true, provider, id: r.id };
      errors.push(`${provider}: ${r.error}`);
    } catch (e) {
      errors.push(`${provider}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }
  return { ok: false, provider: chain[0], error: `All mail services failed (tried ${chain.join(" → ")}). ${errors.join(" | ")}` };
}

async function sendVia(provider: MailProvider, input: SendInput, from: string): Promise<SendResult> {
  if (provider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          html: textToHtml(input.text),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, provider, error: data?.message || `Resend error (HTTP ${res.status})` };
      }
      return { ok: true, provider, id: data?.id };
    }

    if (provider === "sendgrid") {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: input.to }] }],
          from: { email: from.replace(/^.*<|>.*$/g, "") || from },
          subject: input.subject,
          content: [
            { type: "text/plain", value: input.text },
            { type: "text/html", value: textToHtml(input.text) },
          ],
        }),
      });
      if (res.status >= 200 && res.status < 300) {
        return { ok: true, provider, id: res.headers.get("x-message-id") || undefined };
      }
      const err = await res.text().catch(() => "");
      return { ok: false, provider, error: `SendGrid error (HTTP ${res.status}) ${err}`.trim() };
    }

    if (provider === "smtp") {
      const creds = await getSmtpCredentials();
      const host = creds.host || (creds.user ? "smtp.gmail.com" : undefined);
      const port = creds.port || 587;
      // Override the from-address with the live SMTP user so sender = account.
      const fromName = from.replace(/<[^>]*>$/, "").trim() || "FOYSAL IT";
      const finalFrom = creds.user ? `${fromName} <${creds.user}>` : from;
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: creds.user && creds.pass ? { user: creds.user, pass: creds.pass } : undefined,
      });
      const info = await transporter.sendMail({
        from: finalFrom,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: textToHtml(input.text),
      });
      return { ok: true, provider, id: info.messageId };
    }

  return { ok: false, provider, error: "No provider attempted." };
}

// SMTP credentials: DB override (set from the Email Robot card) → env fallback.
export async function getSmtpCredentials(): Promise<{ host?: string; user?: string; pass?: string; port?: number }> {
  try {
    const { db } = await import("@/db");
    const { integrations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const [row] = await db.select().from(integrations).where(eq(integrations.provider, "email")).limit(1);
    const cfg = (row?.config || {}) as Record<string, string>;
    const envPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "").replace(/\s+/g, "") || undefined;
    return {
      host: cfg.host || process.env.SMTP_HOST || undefined,
      user: cfg.user || process.env.GMAIL_USER || process.env.SMTP_USER || (envPass ? BUSINESS_SENDER : undefined),
      pass: (cfg.appPassword || "").replace(/\s+/g, "") || envPass,
      port: cfg.port ? Number(cfg.port) : process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    };
  } catch {
    const envPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
    return {
      host: process.env.SMTP_HOST,
      user: process.env.GMAIL_USER || process.env.SMTP_USER || (envPass ? BUSINESS_SENDER : undefined),
      pass: envPass,
    };
  }
}
