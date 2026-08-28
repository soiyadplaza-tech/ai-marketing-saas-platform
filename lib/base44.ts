// Real Base44 "DataSheet Hub" integration. Reads the master Lead spreadsheet
// via the Base44 REST API using server-side credentials. No fake data — if the
// credentials are missing or the API errors, callers surface a real error.

export interface Base44Lead {
  id: string;
  company?: string;
  contact_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  company_address?: string;
  linkedin_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  lead_score?: number;
  website_score?: number;
  seo_score?: number;
  local_seo_score?: number;
  social_score?: number;
  priority?: string;
  lead_status?: string;
  recommended_service?: string;
  audit_status?: string;
  technologies?: string;
  tags?: string[];
  employees?: number;
  annual_revenue?: number;
  notes?: string;
}

export function base44Configured(): boolean {
  return !!(process.env.BASE44_APP_ID && process.env.BASE44_API_KEY);
}

function baseUrl(entity: string, params = "") {
  return `https://app.base44.com/api/apps/${process.env.BASE44_APP_ID}/entities/${entity}${params}`;
}

async function b44Fetch(entity: string, params = ""): Promise<unknown> {
  if (!base44Configured()) throw new Error("Base44 is not configured (BASE44_APP_ID / BASE44_API_KEY).");
  const res = await fetch(baseUrl(entity, params), {
    headers: { api_key: process.env.BASE44_API_KEY as string },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data as { message?: string }).message) || `Base44 error (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchBase44Leads(limit = 1000): Promise<Base44Lead[]> {
  const data = await b44Fetch("Lead", `?limit=${limit}`);
  if (!Array.isArray(data)) return [];
  return data as Base44Lead[];
}

export async function pingBase44(): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const res = await fetch(`https://app.base44.com/api/apps/${process.env.BASE44_APP_ID}`, {
      headers: { api_key: process.env.BASE44_API_KEY as string },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { name?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message || `HTTP ${res.status}` };
    return { ok: true, name: data.name };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Connection failed" };
  }
}

// Map a Base44 lead into our internal lead shape.
export function mapBase44Lead(b: Base44Lead) {
  const social: Record<string, string> = {};
  if (b.linkedin_url) social.linkedin = b.linkedin_url;
  if (b.facebook_url) social.facebook = b.facebook_url;
  if (b.twitter_url) social.twitter = b.twitter_url;

  const location = [b.city, b.state, b.country].filter(Boolean).join(", ") || b.company_address || null;
  const cat = normalizeCategory(b.priority, b.lead_score);

  return {
    company: b.company || "Unknown Business",
    contactName: b.contact_name || null,
    email: b.email || null,
    phone: b.phone || null,
    whatsapp: b.whatsapp || b.phone || null,
    website: b.website || null,
    industry: b.industry || null,
    location,
    socialProfiles: social,
    leadScore: Math.round(b.lead_score ?? 0),
    scoreCategory: cat,
    websiteScore: b.website_score != null ? Math.round(b.website_score) : null,
    seoScore: b.seo_score != null ? Math.round(b.seo_score) : null,
    localSeoScore: b.local_seo_score != null ? Math.round(b.local_seo_score) : null,
    socialScore: b.social_score != null ? Math.round(b.social_score) : null,
    recommendedServices: mapService(b.recommended_service),
    tags: Array.isArray(b.tags) ? b.tags : [],
    notes: b.notes || null,
    externalId: b.id,
  };
}

function normalizeCategory(priority?: string, score?: number): string {
  const p = (priority || "").toLowerCase();
  if (["priority", "hot", "warm", "cold"].includes(p)) return p === "priority" ? "priority" : p;
  const s = score ?? 0;
  if (s >= 80) return "priority";
  if (s >= 60) return "hot";
  if (s >= 40) return "warm";
  return "cold";
}

const SERVICE_NAME_TO_KEY: Record<string, string> = {
  "seo optimization": "seo",
  seo: "seo",
  "meta ads management": "meta_ads",
  "meta ads": "meta_ads",
  "google ads": "google_ads",
  "social media marketing": "social",
  "youtube seo": "youtube_seo",
  "local seo & map ranking": "local_seo",
  "local seo": "local_seo",
  "backlink building": "backlinks",
  "analytics setup": "analytics",
};

function mapService(name?: string): string[] {
  if (!name) return [];
  const key = SERVICE_NAME_TO_KEY[name.trim().toLowerCase()];
  return key ? [key] : [];
}
