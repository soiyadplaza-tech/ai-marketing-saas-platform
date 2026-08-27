export const DOMAIN = process.env.CUSTOM_DOMAIN || "foysalit.publicvm.com";
export const ROOT_BRAND_DOMAIN = "foysalit.com";
export const APP_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || `https://${DOMAIN}`;
export const WWW_URL = `https://www.${DOMAIN}`;
export const MAIL_FROM_DEFAULT = `FOYSAL IT <foysalahmed.dm23@gmail.com>`;
export const CRON_PATH = "/api/cron/autopilot";

export function publicAppUrl(): string {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || APP_URL).replace(/\/$/, "");
}

export function cronAutopilotUrl(): string {
  return `${publicAppUrl()}${CRON_PATH}`;
}

export function isCompanyDomain(host?: string | null): boolean {
  if (!host) return false;
  const h = host.replace(/:\d+$/, "").toLowerCase();
  return h === DOMAIN || h === `www.${DOMAIN}` || h === ROOT_BRAND_DOMAIN || h === `www.${ROOT_BRAND_DOMAIN}`;
}
