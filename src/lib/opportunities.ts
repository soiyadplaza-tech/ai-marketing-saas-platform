import type { AuditResult } from "./audit";
import type { ServiceKey } from "./services";

export interface DetectedOpportunity {
  problem: string;
  evidence: string;
  severity: "low" | "medium" | "high";
  businessImpact: string;
  recommendedService: ServiceKey;
  recommendedAction: string;
  confidence: number;
}

// Maps concrete audit signals to FOYSAL IT service opportunities.
export function detectOpportunities(audit: AuditResult): DetectedOpportunity[] {
  const ops: DetectedOpportunity[] = [];
  const m = audit.meta;

  // SEO opportunities
  const seoIssues: string[] = [];
  if (!m.title) seoIssues.push("missing title tag");
  else if (m.title.length < 30 || m.title.length > 65) seoIssues.push("poorly sized title");
  if (!m.description) seoIssues.push("no meta description");
  if (m.h1Count !== 1) seoIssues.push(`${m.h1Count} H1 headings`);
  if (m.wordCount < 300) seoIssues.push("thin content");
  if (!audit.sitemap.found) seoIssues.push("no XML sitemap");
  if (audit.scores.onpage < 70 || seoIssues.length >= 2) {
    ops.push({
      problem: "Weak organic search visibility",
      evidence: `On-page SEO score ${audit.scores.onpage}/100. Issues: ${seoIssues.join(", ") || "structural gaps"}.`,
      severity: audit.scores.onpage < 45 ? "high" : "medium",
      businessImpact: "The business is losing organic traffic and qualified visitors to competitors ranking higher.",
      recommendedService: "seo",
      recommendedAction: "Propose an SEO Optimization audit + on-page fixes and a content roadmap.",
      confidence: 85,
    });
  }

  // Local SEO
  if (audit.scores.local < 70) {
    ops.push({
      problem: "Weak local / Google Maps presence",
      evidence: `Local score ${audit.scores.local}/100 — no LocalBusiness schema / map signals detected.`,
      severity: audit.scores.local < 40 ? "high" : "medium",
      businessImpact: "Losing high-intent 'near me' customers who convert quickly.",
      recommendedService: "local_seo",
      recommendedAction: "Offer Local SEO & Map Ranking: Google Business Profile optimization + citations.",
      confidence: 78,
    });
  }

  // Analytics / tracking
  if (!audit.tracking.googleAnalytics && !audit.tracking.gtm) {
    ops.push({
      problem: "No analytics tracking installed",
      evidence: "Neither Google Analytics nor Google Tag Manager was detected in the page source.",
      severity: "high",
      businessImpact: "The business is flying blind — it cannot measure traffic, conversions, or ROI.",
      recommendedService: "gtm_ga4",
      recommendedAction: "Propose GTM & GA4 Setup: GA4 + Tag Manager + conversion tracking.",
      confidence: 92,
    });
  }

  // Meta Ads / pixel
  if (!audit.tracking.metaPixel) {
    ops.push({
      problem: "No Meta Pixel — cannot run/retarget Facebook & Instagram ads",
      evidence: "No Facebook/Meta Pixel code detected on the website.",
      severity: "medium",
      businessImpact: "Cannot retarget warm visitors or measure Meta ad performance.",
      recommendedService: "meta_pixels",
      recommendedAction: "Install & verify Meta Pixel, then offer Meta Ads with retargeting funnels.",
      confidence: 80,
    });
  }

  // Google Ads
  if (!audit.tracking.googleAds) {
    ops.push({
      problem: "No Google Ads conversion tracking",
      evidence: "No Google Ads / conversion tag detected.",
      severity: "low",
      businessImpact: "Paid search opportunities are untapped or unmeasured.",
      recommendedService: "google_ads",
      recommendedAction: "Pitch Google Ads with proper conversion tracking for measurable ROI.",
      confidence: 65,
    });
  }

  // Social
  if (audit.scores.social < 70) {
    ops.push({
      problem: "Weak social media presence",
      evidence: `Only ${Object.keys(m.socialLinks).length} social profiles linked from the site.`,
      severity: "medium",
      businessImpact: "Missing brand awareness and engagement channels.",
      recommendedService: "social",
      recommendedAction: "Propose Social Media Marketing to build presence and engagement.",
      confidence: 70,
    });
  }

  // YouTube
  if (!m.socialLinks.youtube) {
    ops.push({
      problem: "No YouTube presence / video optimization",
      evidence: "No YouTube channel linked from the website.",
      severity: "low",
      businessImpact: "Missing video discovery traffic and long-form content authority.",
      recommendedService: "youtube_seo",
      recommendedAction: "Offer YouTube SEO to capture video search demand.",
      confidence: 60,
    });
  }

  // Backlinks (proxy via low authority signals: thin content + no schema)
  if (m.wordCount < 500 && !m.hasSchema) {
    ops.push({
      problem: "Likely weak backlink & authority profile",
      evidence: "Thin content and no structured data suggest low domain authority investment.",
      severity: "low",
      businessImpact: "Lower rankings versus authoritative competitors.",
      recommendedService: "backlinks",
      recommendedAction: "Propose Backlink Building to grow domain authority.",
      confidence: 55,
    });
  }

  // Conversion / performance
  if (!m.hasContactForm) {
    ops.push({
      problem: "No lead-capture form",
      evidence: "No contact form or email input detected on the page.",
      severity: "medium",
      businessImpact: "Visitors have no easy way to convert into leads.",
      recommendedService: "seo",
      recommendedAction: "Recommend conversion-focused landing page improvements within the SEO engagement.",
      confidence: 68,
    });
  }
  if (!m.hasViewport) {
    ops.push({
      problem: "Not mobile optimized",
      evidence: "No responsive viewport meta tag detected.",
      severity: "high",
      businessImpact: "Most traffic is mobile — poor mobile UX kills conversions and rankings.",
      recommendedService: "technical_seo",
      recommendedAction: "Prioritize mobile-first Technical SEO: viewport, speed and Core Web Vitals.",
      confidence: 82,
    });
  }

  // Technical SEO: heavy page or low performance score
  if (audit.scores.performance < 60 || m.htmlBytes > 400 * 1024) {
    ops.push({
      problem: "Slow page / heavy load — hurts rankings and conversions",
      evidence: `Performance score is ${audit.scores.performance}/100 and the HTML document is ~${Math.round(m.htmlBytes / 1024)}KB.`,
      severity: "high",
      businessImpact: "High bounce and lost revenue from slow load; Google demotes slow pages.",
      recommendedService: "technical_seo",
      recommendedAction: "Offer Technical SEO: Core Web Vitals, image optimization and page-speed fixes.",
      confidence: 84,
    });
  }

  // Keyword / content research opportunity (thin content)
  if (m.wordCount < 500) {
    ops.push({
      problem: "Thin content — limited keyword coverage",
      evidence: `Page has ~${m.wordCount} words, suggesting limited topic/keyword coverage.`,
      severity: "medium",
      businessImpact: "Not ranking for the commercial keywords that drive enquiries.",
      recommendedService: "keyword_research",
      recommendedAction: "Run Keyword Research + on-page content plan to capture high-intent search demand.",
      confidence: 62,
    });
  }

  return ops;
}

export function recommendedServicesFrom(ops: DetectedOpportunity[]): ServiceKey[] {
  return Array.from(new Set(ops.map((o) => o.recommendedService)));
}

// A→Z professional service audit matrix: status of every FOYSAL IT service
// against the audited evidence.
export interface ServiceMatrixRow {
  service: string;
  status: "strong" | "gap" | "not-detected";
  evidence: string;
}

export function serviceAuditMatrix(audit: {
  scores: { technical: number; onpage: number; performance: number; local: number; social: number };
  tracking: { googleAnalytics: boolean; gtm: boolean; metaPixel: boolean; googleAds: boolean; linkedinInsight?: boolean; localBusinessSchema?: boolean; hasMapEmbed?: boolean; napComplete?: boolean };
  meta: { socialLinks: Record<string, string>; wordCount: number; hasViewport: boolean; hasContactForm: boolean };
}): ServiceMatrixRow[] {
  const { scores, tracking, meta } = audit;
  const socialCount = Object.keys(meta.socialLinks).length;
  const hasLinkedIn = !!meta.socialLinks.linkedin;
  const hasFacebook = !!meta.socialLinks.facebook;
  return [
    { service: "seo", status: scores.onpage >= 70 ? "strong" : "gap", evidence: `On-page SEO ${scores.onpage}/100` },
    { service: "technical_seo", status: scores.technical >= 70 && scores.performance >= 70 ? "strong" : "gap", evidence: `Technical ${scores.technical} · Performance ${scores.performance}` },
    { service: "keyword_research", status: meta.wordCount >= 800 ? "strong" : "gap", evidence: `~${meta.wordCount} words of content` },
    { service: "local_seo", status: scores.local >= 70 ? "strong" : "gap", evidence: `Local/Maps score ${scores.local}/100` },
    { service: "meta_pixels", status: tracking.metaPixel ? "strong" : "gap", evidence: tracking.metaPixel ? "Meta Pixel detected" : "No Meta Pixel found" },
    { service: "meta_ads", status: tracking.metaPixel ? "strong" : "gap", evidence: tracking.metaPixel ? "Pixel ready for ads + retargeting" : "Cannot retarget without pixel" },
    { service: "google_ads", status: tracking.googleAds ? "strong" : "not-detected", evidence: tracking.googleAds ? "Conversion tag found" : "No Google Ads tag (opportunity)" },
    { service: "gtm_ga4", status: tracking.gtm || tracking.googleAnalytics ? "strong" : "gap", evidence: tracking.gtm ? "GTM installed" : tracking.googleAnalytics ? "GA detected" : "No tracking at all" },
    { service: "youtube_seo", status: meta.socialLinks.youtube ? "strong" : "not-detected", evidence: meta.socialLinks.youtube ? "YouTube channel linked" : "No YouTube presence" },
    { service: "social", status: scores.social >= 70 ? "strong" : "gap", evidence: `${socialCount} social profile(s) linked` },
    { service: "social_management", status: socialCount >= 2 ? "strong" : "gap", evidence: socialCount >= 2 ? "Multi-platform presence" : "Needs consistent daily posting" },
    { service: "linkedin", status: hasLinkedIn ? "strong" : "gap", evidence: hasLinkedIn ? "LinkedIn profile linked" : "No LinkedIn profile (opportunity)" },
    { service: "facebook", status: hasFacebook ? "strong" : "gap", evidence: hasFacebook ? "Facebook page linked" : "No Facebook page (opportunity)" },
    { service: "backlinks", status: "not-detected", evidence: "Needs backlink profile report" },
    { service: "backlink_index", status: "not-detected", evidence: "Needs link index check" },
    { service: "web_development", status: meta.hasViewport && meta.hasContactForm ? "strong" : "gap", evidence: meta.hasViewport ? (meta.hasContactForm ? "Mobile-ready + lead form" : "Mobile OK, no lead form") : "Not mobile optimized" },
    { service: "full_digital_marketing", status: scores.onpage >= 60 && tracking.gtm ? "strong" : "gap", evidence: "Bundle all channels after tracking is fixed" },
  ];
}
