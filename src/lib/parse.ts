// Data ingestion helpers: CSV parsing, intelligent column mapping, unstructured
// text extraction, normalization and duplicate detection support.

export type LeadField =
  | "company"
  | "contactName"
  | "firstName"
  | "lastName"
  | "title"
  | "email"
  | "phone"
  | "website"
  | "industry"
  | "location"
  | "city"
  | "state"
  | "country"
  | "linkedin"
  | "facebook"
  | "twitter"
  | "keywords"
  | "notes";

export interface ParsedLead {
  company: string;
  contactName?: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  location?: string;
  notes?: string;
  socialProfiles?: Record<string, string>;
  tags?: string[];
  // Full captured data — every recognized/unrecognized column value.
  enrichment?: Record<string, string>;
}

// AI-style fuzzy header mapping. Different column names collapse to one field.
const FIELD_ALIASES: Record<LeadField, string[]> = {
  company: ["company", "companyname", "companynameforemails", "business", "businessname", "organization", "organisation", "org", "account", "client"],
  contactName: ["contact", "contactname", "person", "fullname", "owner", "poc"],
  firstName: ["firstname", "first"],
  lastName: ["lastname", "last", "surname"],
  title: ["title", "jobtitle", "position", "role", "designation"],
  email: ["email", "emailaddress", "mail", "e-mail", "contactemail", "workemail"],
  phone: ["phone", "phonenumber", "firstphone", "corporatephone", "workdirectphone", "mobilephone", "mobile", "cell", "tel", "telephone", "contactnumber", "homephone"],
  website: ["website", "url", "site", "web", "domain", "homepage", "webaddress"],
  industry: ["industry", "sector", "niche", "category", "vertical", "businesstype"],
  location: ["location", "address", "area", "region", "place"],
  city: ["city", "companycity"],
  state: ["state", "companystate"],
  country: ["country", "companycountry"],
  linkedin: ["personlinkedinurl", "linkedinurl", "linkedin"],
  facebook: ["facebookurl", "facebook"],
  twitter: ["twitterurl", "twitter"],
  keywords: ["keywords", "tags", "technologies"],
  notes: ["notes", "note", "comment", "comments", "remarks", "description", "details"],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function mapHeaders(headers: string[]): Record<number, LeadField | null> {
  const map: Record<number, LeadField | null> = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    let best: LeadField | null = null;
    let bestScore = 0;
    (Object.keys(FIELD_ALIASES) as LeadField[]).forEach((field) => {
      for (const alias of FIELD_ALIASES[field]) {
        const a = norm(alias);
        let score = 0;
        if (n === a) score = 100;
        else if (n.includes(a) || a.includes(n)) score = 60 + Math.min(a.length, n.length);
        if (score > bestScore) {
          bestScore = score;
          best = field;
        }
      }
    });
    map[i] = bestScore >= 60 ? best : null;
  });
  return map;
}

// Minimal RFC-ish CSV parser (handles quotes + commas + newlines).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (c === "\r") {
        // ignore
      } else cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function csvToLeads(text: string): { leads: ParsedLead[]; mapping: Record<string, string>; headers: string[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { leads: [], mapping: {}, headers: [] };
  const headers = rows[0];
  const hmap = mapHeaders(headers);
  const mapping: Record<string, string> = {};
  headers.forEach((h, i) => {
    mapping[h] = hmap[i] || "(ignored)";
  });
  const leads: ParsedLead[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Bucket for direct fields, plus firstName/lastName/city/state/country
    // helpers and the full raw enrichment record.
    const b: Record<string, string> = {};
    const social: Record<string, string> = {};
    const enrichment: Record<string, string> = {};

    row.forEach((val, i) => {
      const v = (val || "").trim();
      if (!v) return;
      const header = headers[i] || `col_${i}`;
      enrichment[header] = v; // capture EVERY column so all data is retained
      const field = hmap[i];
      if (!field) return;
      if (field === "linkedin" || field === "facebook" || field === "twitter") {
        if (/^https?:\/\//i.test(v) || v.includes(".")) social[field] = v;
        return;
      }
      // keep first value for a field if duplicated headers map to same field
      if (!b[field]) b[field] = v;
    });

    const contactName =
      b.contactName ||
      [b.firstName, b.lastName].filter(Boolean).join(" ").trim() ||
      undefined;
    const location =
      b.location ||
      [b.city, b.state, b.country].filter(Boolean).join(", ").trim() ||
      undefined;

    const tags = b.keywords
      ? b.keywords.split(/[,;|]/).map((t) => t.trim()).filter(Boolean).slice(0, 12)
      : undefined;

    let company = b.company;
    if (!company && b.email) company = b.email.split("@")[1] || "Unknown";
    if (!company && contactName) company = contactName;
    if (!company) continue; // skip empty rows

    const lead: ParsedLead = {
      company,
      contactName,
      title: b.title,
      email: b.email,
      phone: b.phone,
      website: b.website,
      industry: b.industry,
      location,
      socialProfiles: Object.keys(social).length ? social : undefined,
      tags,
      notes: b.notes,
      enrichment,
    };
    leads.push(normalizeLead(lead));
  }
  return { leads, mapping, headers };
}

// Extract structured leads from unstructured pasted text (AI text ingestion).
export function textToLeads(text: string): ParsedLead[] {
  const emails = Array.from(new Set(text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []));
  const urls = Array.from(new Set(text.match(/(https?:\/\/[^\s,]+)|(www\.[^\s,]+)/gi) || []));
  const phones = Array.from(new Set(text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []));

  // If it looks like line-per-record, split by lines.
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const leads: ParsedLead[] = [];

  if (emails.length > 1 || lines.length > 2) {
    // Try to build one lead per email
    for (const email of emails) {
      const line = lines.find((l) => l.includes(email)) || "";
      const lead: ParsedLead = {
        company: guessCompanyFromLine(line, email),
        email,
      };
      const phoneInLine = line.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
      if (phoneInLine) lead.phone = phoneInLine[0].trim();
      const urlInLine = line.match(/(https?:\/\/[^\s,]+)|(www\.[^\s,]+)/i);
      if (urlInLine) lead.website = urlInLine[0];
      leads.push(normalizeLead(lead));
    }
  }

  if (leads.length === 0) {
    // Single record extraction
    const lead: ParsedLead = {
      company:
        (text.match(/(?:company|business|organization)\s*[:\-]\s*([^\n,]+)/i)?.[1] || "").trim() ||
        (urls[0] ? domainToName(urls[0]) : "") ||
        (emails[0] ? emails[0].split("@")[1] : "") ||
        "Unknown Business",
      email: emails[0],
      phone: phones[0]?.trim(),
      website: urls[0],
      notes: text.slice(0, 400),
    };
    leads.push(normalizeLead(lead));
  }

  return leads;
}

function guessCompanyFromLine(line: string, email: string): string {
  const before = line.split(email)[0].replace(/[,-]/g, " ").trim();
  if (before && before.length > 1 && before.length < 60) return before;
  return domainToName(email.split("@")[1] || "");
}

function domainToName(domain: string): string {
  const clean = domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split(".")[0];
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Unknown Business";
}

export function normalizeLead(lead: ParsedLead): ParsedLead {
  const out = { ...lead };
  if (out.website) {
    let w = out.website.trim();
    if (w && !/^https?:\/\//i.test(w)) w = "https://" + w.replace(/^\/+/, "");
    out.website = w;
  }
  if (out.email) out.email = out.email.trim().toLowerCase();
  if (out.phone) out.phone = out.phone.replace(/[^\d+]/g, "");
  if (out.company) out.company = out.company.trim();
  return out;
}

export function isValidEmail(email?: string): boolean {
  if (!email) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
