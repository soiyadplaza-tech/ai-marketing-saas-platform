// Real website audit engine.
// This genuinely fetches the target URL (and robots.txt / sitemap), parses the
// returned HTML and derives objective SEO / technical / conversion / tracking
// findings. No results are faked — if a page cannot be fetched, we return a
// clearly-marked failure so the UI can surface a real error.

export interface Finding {
  category: string; // technical | onpage | performance | conversion | local | social | tracking
  title: string;
  detail: string;
  severity: "good" | "info" | "warning" | "critical";
  passed: boolean;
}

export interface AuditResult {
  url: string;
  finalUrl: string;
  ok: boolean;
  error?: string;
  fetchedAt: string;
  overallScore: number;
  scores: {
    technical: number;
    onpage: number;
    performance: number;
    conversion: number;
    local: number;
    social: number;
  };
  findings: Finding[];
  tracking: {
    googleAnalytics: boolean;
    gtm: boolean;
    metaPixel: boolean;
    googleAds: boolean;
    tiktokPixel: boolean;
    linkedinInsight: boolean;
    localBusinessSchema: boolean;
    hasMapEmbed: boolean;
    napComplete: boolean;
  };
  meta: {
    title: string | null;
    description: string | null;
    h1Count: number;
    h2Count: number;
    imgCount: number;
    imgMissingAlt: number;
    internalLinks: number;
    wordCount: number;
    https: boolean;
    hasViewport: boolean;
    hasSchema: boolean;
    hasCanonical: boolean;
    hasOgTags: boolean;
    htmlBytes: number;
    hasContactForm: boolean;
    phones: string[];
    emails: string[];
    socialLinks: Record<string, string>;
  };
  robots: { found: boolean; hasSitemapRef: boolean };
  sitemap: { found: boolean };
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

async function safeFetch(url: string, timeoutMs = 12000): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FoysalIT-Auditor/1.0; +https://sites.google.com/view/foysal-it/)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

function extract(re: RegExp, html: string): string | null {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  facebook: /facebook\.com\/[A-Za-z0-9_.\-/]+/i,
  instagram: /instagram\.com\/[A-Za-z0-9_.\-/]+/i,
  linkedin: /linkedin\.com\/[A-Za-z0-9_.\-/]+/i,
  twitter: /(?:twitter|x)\.com\/[A-Za-z0-9_.\-/]+/i,
  youtube: /youtube\.com\/[A-Za-z0-9_.\-/@]+/i,
  tiktok: /tiktok\.com\/[A-Za-z0-9_.\-/@]+/i,
};

export async function runAudit(rawUrl: string): Promise<AuditResult> {
  const url = normalizeUrl(rawUrl);
  const now = new Date().toISOString();
  const res = await safeFetch(url);

  const base: AuditResult = {
    url,
    finalUrl: url,
    ok: false,
    fetchedAt: now,
    overallScore: 0,
    scores: { technical: 0, onpage: 0, performance: 0, conversion: 0, local: 0, social: 0 },
    findings: [],
    tracking: {
      googleAnalytics: false,
      gtm: false,
      metaPixel: false,
      googleAds: false,
      tiktokPixel: false,
      linkedinInsight: false,
      localBusinessSchema: false,
      hasMapEmbed: false,
      napComplete: false,
    },
    meta: {
      title: null,
      description: null,
      h1Count: 0,
      h2Count: 0,
      imgCount: 0,
      imgMissingAlt: 0,
      internalLinks: 0,
      wordCount: 0,
      https: url.startsWith("https://"),
      hasViewport: false,
      hasSchema: false,
      hasCanonical: false,
      hasOgTags: false,
      htmlBytes: 0,
      hasContactForm: false,
      phones: [],
      emails: [],
      socialLinks: {},
    },
    robots: { found: false, hasSitemapRef: false },
    sitemap: { found: false },
  };

  if (!res || !res.ok) {
    base.error = res ? `Server responded with HTTP ${res.status}` : "Could not reach the website (timeout or DNS error)";
    base.findings.push({
      category: "technical",
      title: "Website unreachable",
      detail: base.error,
      severity: "critical",
      passed: false,
    });
    return base;
  }

  base.ok = true;
  base.finalUrl = res.url || url;
  const html = await res.text();
  const lower = html.toLowerCase();
  base.meta.htmlBytes = html.length;

  // ---- Parse core signals ----
  const title = extract(/<title[^>]*>([\s\S]*?)<\/title>/i, html);
  const description = extract(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html);
  base.meta.title = title;
  base.meta.description = description;
  base.meta.h1Count = countMatches(html, /<h1[\s>]/gi);
  base.meta.h2Count = countMatches(html, /<h2[\s>]/gi);
  base.meta.imgCount = countMatches(html, /<img[\s>]/gi);

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  base.meta.imgMissingAlt = imgTags.filter((t) => !/alt\s*=\s*["'][^"']+["']/i.test(t)).length;

  base.meta.internalLinks = countMatches(html, /<a[\s>]/gi);
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  base.meta.wordCount = textOnly ? textOnly.split(" ").length : 0;
  base.meta.https = base.finalUrl.startsWith("https://");
  base.meta.hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  base.meta.hasSchema =
    /application\/ld\+json/i.test(html) || /itemscope/i.test(html) || /schema\.org/i.test(html);
  base.meta.hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  base.meta.hasOgTags = /<meta[^>]+property=["']og:/i.test(html);
  base.meta.hasContactForm = /<form[\s>]/i.test(html) || /type=["']email["']/i.test(html);

  // Contact info
  const emails = Array.from(new Set((html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).filter((e) => !/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(e)))).slice(0, 5);
  base.meta.emails = emails;
  const phones = Array.from(new Set(html.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [])).slice(0, 5);
  base.meta.phones = phones;

  for (const [k, re] of Object.entries(SOCIAL_PATTERNS)) {
    const m = html.match(re);
    if (m) base.meta.socialLinks[k] = "https://" + m[0].replace(/^https?:\/\//, "");
  }

  // ---- Tracking / pixel detection (A→Z) ----
  base.tracking.googleAnalytics =
    /gtag\(|google-analytics\.com|googletagmanager\.com\/gtag|ga\.js|analytics\.js/i.test(lower);
  base.tracking.gtm = /googletagmanager\.com\/gtm|gtm-[a-z0-9]+/i.test(lower);
  base.tracking.metaPixel = /connect\.facebook\.net|fbq\(|facebook pixel/i.test(lower);
  base.tracking.googleAds = /googleadservices\.com|aw-\d+|google_conversion/i.test(lower);
  base.tracking.tiktokPixel = /analytics\.tiktok\.com|ttq\./i.test(lower);
  base.tracking.linkedinInsight = /snap\.licdn\.com|_linkedin_partner_id|linkedin\.com\/company/i.test(lower);
  // Local SEO signals (GBP / local schema / NAP / map embed)
  base.tracking.localBusinessSchema = /localbusiness|localbusinessschema|postaladdress|addressLocality/i.test(lower);
  base.tracking.hasMapEmbed = /google\.com\/maps|maps\.google|goo\.gl\/maps|google\.com\/maps?\/embed/i.test(lower);
  base.tracking.napComplete = base.meta.phones.length > 0 && (base.meta.emails.length > 0 || /address|address/i.test(lower));

  // ---- robots.txt + sitemap ----
  try {
    const origin = new URL(base.finalUrl).origin;
    const robotsRes = await safeFetch(origin + "/robots.txt", 6000);
    if (robotsRes && robotsRes.ok) {
      const robotsText = await robotsRes.text();
      base.robots.found = true;
      base.robots.hasSitemapRef = /sitemap:/i.test(robotsText);
    }
    const sitemapRes = await safeFetch(origin + "/sitemap.xml", 6000);
    base.sitemap.found = !!(sitemapRes && sitemapRes.ok);
  } catch {
    /* ignore */
  }

  computeFindingsAndScores(base);
  return base;
}

function push(base: AuditResult, f: Finding) {
  base.findings.push(f);
}

function computeFindingsAndScores(base: AuditResult) {
  const m = base.meta;

  // ---------- Technical ----------
  push(base, m.https
    ? { category: "technical", title: "HTTPS enabled", detail: "The site is served securely over HTTPS.", severity: "good", passed: true }
    : { category: "technical", title: "No HTTPS", detail: "Site is not secure. This hurts trust and rankings.", severity: "critical", passed: false });
  push(base, base.robots.found
    ? { category: "technical", title: "robots.txt present", detail: base.robots.hasSitemapRef ? "robots.txt references a sitemap." : "robots.txt found (no sitemap reference).", severity: "good", passed: true }
    : { category: "technical", title: "robots.txt missing", detail: "No robots.txt found — crawlers get no guidance.", severity: "warning", passed: false });
  push(base, base.sitemap.found
    ? { category: "technical", title: "XML sitemap found", detail: "sitemap.xml is available for search engines.", severity: "good", passed: true }
    : { category: "technical", title: "No XML sitemap", detail: "No sitemap.xml — indexing may be incomplete.", severity: "warning", passed: false });
  push(base, m.hasCanonical
    ? { category: "technical", title: "Canonical tag present", detail: "Canonical signals help avoid duplicate content.", severity: "good", passed: true }
    : { category: "technical", title: "No canonical tag", detail: "Missing canonical can cause duplicate content issues.", severity: "warning", passed: false });
  push(base, m.hasSchema
    ? { category: "technical", title: "Structured data detected", detail: "Schema markup can enable rich results.", severity: "good", passed: true }
    : { category: "technical", title: "No structured data", detail: "No schema.org markup found — missing rich-result opportunities.", severity: "warning", passed: false });

  // ---------- On-page ----------
  if (m.title) {
    const len = m.title.length;
    push(base, len >= 30 && len <= 65
      ? { category: "onpage", title: "Title tag optimized", detail: `Title is ${len} chars — a healthy length.`, severity: "good", passed: true }
      : { category: "onpage", title: "Title length not ideal", detail: `Title is ${len} chars. Aim for 30–65 characters.`, severity: "warning", passed: false });
  } else {
    push(base, { category: "onpage", title: "Missing title tag", detail: "No <title> found — critical for SEO.", severity: "critical", passed: false });
  }
  if (m.description) {
    const len = m.description.length;
    push(base, len >= 70 && len <= 165
      ? { category: "onpage", title: "Meta description optimized", detail: `Description is ${len} chars.`, severity: "good", passed: true }
      : { category: "onpage", title: "Meta description length off", detail: `Description is ${len} chars. Aim for 70–165.`, severity: "warning", passed: false });
  } else {
    push(base, { category: "onpage", title: "Missing meta description", detail: "No meta description found — hurts click-through rate.", severity: "critical", passed: false });
  }
  push(base, m.h1Count === 1
    ? { category: "onpage", title: "Single H1 heading", detail: "Exactly one H1 — ideal structure.", severity: "good", passed: true }
    : { category: "onpage", title: m.h1Count === 0 ? "No H1 heading" : "Multiple H1 headings", detail: `Found ${m.h1Count} H1 tags. Use exactly one.`, severity: m.h1Count === 0 ? "critical" : "warning", passed: false });
  push(base, m.imgMissingAlt === 0 && m.imgCount > 0
    ? { category: "onpage", title: "All images have alt text", detail: `${m.imgCount} images all have alt attributes.`, severity: "good", passed: true }
    : m.imgCount === 0
      ? { category: "onpage", title: "No images detected", detail: "No <img> tags found on the page.", severity: "info", passed: false }
      : { category: "onpage", title: "Images missing alt text", detail: `${m.imgMissingAlt} of ${m.imgCount} images lack alt text.`, severity: "warning", passed: false });
  push(base, m.wordCount >= 300
    ? { category: "onpage", title: "Sufficient content", detail: `~${m.wordCount} words of content.`, severity: "good", passed: true }
    : { category: "onpage", title: "Thin content", detail: `Only ~${m.wordCount} words. Search engines favor richer content.`, severity: "warning", passed: false });
  push(base, m.hasOgTags
    ? { category: "onpage", title: "Open Graph tags present", detail: "Social sharing previews are configured.", severity: "good", passed: true }
    : { category: "onpage", title: "No Open Graph tags", detail: "Missing OG tags — poor social sharing previews.", severity: "warning", passed: false });

  // ---------- Performance ----------
  push(base, m.hasViewport
    ? { category: "performance", title: "Mobile viewport set", detail: "Responsive viewport meta tag present.", severity: "good", passed: true }
    : { category: "performance", title: "No mobile viewport", detail: "Missing viewport tag — poor mobile usability.", severity: "critical", passed: false });
  const kb = Math.round(m.htmlBytes / 1024);
  push(base, kb <= 150
    ? { category: "performance", title: "Lean HTML payload", detail: `HTML document is ~${kb} KB.`, severity: "good", passed: true }
    : { category: "performance", title: "Heavy HTML payload", detail: `HTML is ~${kb} KB — consider optimization for faster loads.`, severity: kb > 400 ? "warning" : "info", passed: kb <= 150 });

  // ---------- Conversion ----------
  push(base, m.hasContactForm
    ? { category: "conversion", title: "Contact form / lead capture", detail: "A form or email input was detected.", severity: "good", passed: true }
    : { category: "conversion", title: "No contact form", detail: "No lead-capture form found — missed conversions.", severity: "warning", passed: false });
  push(base, m.phones.length > 0
    ? { category: "conversion", title: "Phone number visible", detail: `Contact phone detected on the page.`, severity: "good", passed: true }
    : { category: "conversion", title: "No phone number", detail: "No visible phone number — trust/conversion gap.", severity: "info", passed: false });
  push(base, m.emails.length > 0
    ? { category: "conversion", title: "Email contact visible", detail: "Contact email detected.", severity: "good", passed: true }
    : { category: "conversion", title: "No email visible", detail: "No contact email found on the page.", severity: "info", passed: false });

  // ---------- Local SEO ----------
  push(base, base.tracking.localBusinessSchema
    ? { category: "local", title: "Local business schema", detail: "Local business structured data detected.", severity: "good", passed: true }
    : { category: "local", title: "No local business schema", detail: "Add LocalBusiness schema + NAP for map ranking.", severity: "warning", passed: false });
  push(base, base.tracking.hasMapEmbed
    ? { category: "local", title: "Embedded map", detail: "A Google Map embed was found.", severity: "good", passed: true }
    : { category: "local", title: "No embedded map", detail: "No Google Map embed — weak local signals.", severity: "info", passed: false });
  push(base, base.tracking.napComplete
    ? { category: "local", title: "NAP (Name/Address/Phone) present", detail: "Name, address and phone present — good for local SEO.", severity: "good", passed: true }
    : { category: "local", title: "NAP incomplete", detail: "Missing consistent Name/Address/Phone — hurts local SEO.", severity: "warning", passed: false });

  // ---------- Social ----------
  const socialCount = Object.keys(m.socialLinks).length;
  push(base, socialCount >= 2
    ? { category: "social", title: "Social profiles linked", detail: `${socialCount} social profiles linked.`, severity: "good", passed: true }
    : { category: "social", title: "Weak social presence", detail: socialCount === 0 ? "No social profile links found." : "Only one social profile linked.", severity: "warning", passed: false });

  // ---------- LinkedIn ----------
  push(base, base.tracking.linkedinInsight
    ? { category: "social", title: "LinkedIn Insight Tag", detail: "LinkedIn Insight Tag detected — conversion tracking enabled.", severity: "good", passed: true }
    : { category: "social", title: "No LinkedIn Insight Tag", detail: "No LinkedIn Insight Tag — can't track LinkedIn conversions.", severity: "info", passed: false });
  push(base, m.socialLinks.linkedin
    ? { category: "social", title: "LinkedIn profile linked", detail: "A LinkedIn profile is linked from the site.", severity: "good", passed: true }
    : { category: "social", title: "No LinkedIn profile linked", detail: "No LinkedIn profile linked — weak professional presence.", severity: "info", passed: false });

  // ---------- Facebook ----------
  push(base, m.socialLinks.facebook
    ? { category: "social", title: "Facebook profile linked", detail: "A Facebook profile/page is linked from the site.", severity: "good", passed: true }
    : { category: "social", title: "No Facebook profile linked", detail: "No Facebook profile/page linked — weak social presence.", severity: "warning", passed: false });
  push(base, base.tracking.metaPixel
    ? { category: "social", title: "Meta Pixel installed", detail: "Facebook/Meta Pixel detected — retargeting enabled.", severity: "good", passed: true }
    : { category: "social", title: "No Meta Pixel", detail: "No Meta Pixel — cannot retarget on Facebook/Instagram.", severity: "warning", passed: false });

  // ---------- Meta Ads ----------
  push(base, base.tracking.metaPixel
    ? { category: "tracking", title: "Meta Ads retargeting ready", detail: "Meta Pixel present — retargeting & ad attribution enabled.", severity: "good", passed: true }
    : { category: "tracking", title: "No Meta Ads retargeting", detail: "No Meta Pixel — cannot run/retarget Facebook & Instagram ads.", severity: "warning", passed: false });

  // ---------- Tracking ----------
  push(base, base.tracking.googleAnalytics || base.tracking.gtm
    ? { category: "tracking", title: "Analytics installed", detail: base.tracking.gtm ? "Google Tag Manager detected." : "Google Analytics detected.", severity: "good", passed: true }
    : { category: "tracking", title: "No analytics tracking", detail: "No Google Analytics / GTM — cannot measure performance.", severity: "critical", passed: false });
  push(base, base.tracking.googleAds
    ? { category: "tracking", title: "Google Ads tag detected", detail: "Conversion tracking for Google Ads present.", severity: "good", passed: true }
    : { category: "tracking", title: "No Google Ads tag", detail: "No Google Ads conversion tag detected.", severity: "info", passed: false });

  // ---------- Scores ----------
  base.scores.technical = scoreCategory(base, "technical");
  base.scores.onpage = scoreCategory(base, "onpage");
  base.scores.performance = scoreCategory(base, "performance");
  base.scores.conversion = scoreCategory(base, "conversion");
  base.scores.local = scoreCategory(base, "local");
  base.scores.social = scoreCategory(base, "social");

  base.overallScore = Math.round(
    base.scores.technical * 0.25 +
      base.scores.onpage * 0.3 +
      base.scores.performance * 0.15 +
      base.scores.conversion * 0.15 +
      base.scores.local * 0.08 +
      base.scores.social * 0.07
  );
}

function scoreCategory(base: AuditResult, cat: string): number {
  const items = base.findings.filter((f) => f.category === cat);
  if (items.length === 0) return 60;
  let score = 0;
  for (const f of items) {
    if (f.severity === "good") score += 1;
    else if (f.severity === "info") score += 0.5;
    else if (f.severity === "warning") score += 0.25;
    // critical => 0
  }
  return Math.round((score / items.length) * 100);
}
