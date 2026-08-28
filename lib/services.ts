// FOYSAL IT service catalog — single source of truth used across the app.
// Updated to the full "Our Services" menu.

export type ServiceKey =
  | "seo"
  | "social"
  | "social_management"
  | "meta_ads"
  | "google_ads"
  | "technical_seo"
  | "youtube_seo"
  | "local_seo"
  | "gtm_ga4"
  | "backlinks"
  | "keyword_research"
  | "backlink_index"
  | "full_digital_marketing"
  | "web_development"
  | "meta_pixels";

export interface ServiceDef {
  key: ServiceKey;
  name: string;
  short: string;
  description: string;
  icon: string;
  color: string;
}

export const SERVICES: Record<ServiceKey, ServiceDef> = {
  seo: {
    key: "seo",
    name: "Search Engine Optimization (SEO)",
    short: "SEO",
    description: "Improve organic search visibility, on-page SEO and content.",
    icon: "🔍",
    color: "#2563eb",
  },
  social: {
    key: "social",
    name: "Social Media Marketing",
    short: "Social Marketing",
    description: "Content, engagement and growth campaigns across social platforms.",
    icon: "💬",
    color: "#db2777",
  },
  social_management: {
    key: "social_management",
    name: "Social Media Management",
    short: "Social Management",
    description: "Daily page handling, posting, community and profile management.",
    icon: "🗂️",
    color: "#9333ea",
  },
  meta_ads: {
    key: "meta_ads",
    name: "Meta Ads",
    short: "Meta Ads",
    description: "Facebook & Instagram advertising, pixel setup and retargeting.",
    icon: "📣",
    color: "#4f46e5",
  },
  google_ads: {
    key: "google_ads",
    name: "Google Ads",
    short: "Google Ads",
    description: "Search, Display and Performance Max campaign management.",
    icon: "🎯",
    color: "#16a34a",
  },
  technical_seo: {
    key: "technical_seo",
    name: "Technical SEO",
    short: "Technical SEO",
    description: "Site speed, crawlability, indexation, schema and Core Web Vitals.",
    icon: "⚙️",
    color: "#0d9488",
  },
  youtube_seo: {
    key: "youtube_seo",
    name: "YouTube SEO",
    short: "YouTube SEO",
    description: "Video optimization, discovery and channel growth.",
    icon: "▶️",
    color: "#dc2626",
  },
  local_seo: {
    key: "local_seo",
    name: "Local SEO & Google Maps Ranking",
    short: "Local SEO",
    description: "Google Business Profile, map pack ranking and local citations.",
    icon: "📍",
    color: "#ea580c",
  },
  gtm_ga4: {
    key: "gtm_ga4",
    name: "GTM & GA4 Setup",
    short: "GTM & GA4",
    description: "Google Tag Manager & GA4 implementation, events and reporting.",
    icon: "📊",
    color: "#7c3aed",
  },
  backlinks: {
    key: "backlinks",
    name: "Backlink Services",
    short: "Backlinks",
    description: "Authority building through high-quality link acquisition.",
    icon: "🔗",
    color: "#0891b2",
  },
  keyword_research: {
    key: "keyword_research",
    name: "Keyword Research",
    short: "Keyword Research",
    description: "Discover high-intent keywords and content opportunities.",
    icon: "🧠",
    color: "#4338ca",
  },
  backlink_index: {
    key: "backlink_index",
    name: "Backlink Index",
    short: "Backlink Index",
    description: "Monitor, report and index backlinks for ranking authority.",
    icon: "📇",
    color: "#0e7490",
  },
  full_digital_marketing: {
    key: "full_digital_marketing",
    name: "Full Digital Marketing",
    short: "Full Digital Marketing",
    description: "End-to-end strategy, execution and optimization across channels.",
    icon: "🚀",
    color: "#be185d",
  },
  web_development: {
    key: "web_development",
    name: "Web Development",
    short: "Web Development",
    description: "Fast, conversion-focused websites and web applications.",
    icon: "💻",
    color: "#1d4ed8",
  },
  meta_pixels: {
    key: "meta_pixels",
    name: "Meta Pixel",
    short: "Meta Pixel",
    description: "Install and verify Meta Pixel, events and conversion tracking.",
    icon: "🟣",
    color: "#7e22ce",
  },
};

// Backwards-compatible alias: older data stored the analytics key as "analytics".
export const SERVICES_LEGACY: Record<string, ServiceKey> = {
  analytics: "gtm_ga4",
  meta_ads_management: "meta_ads",
};

export const SERVICE_LIST = Object.values(SERVICES);

export const COMPANY = {
  name: "FOYSAL IT",
  tagline: "Turn Every Lead Into An Opportunity.",
  call: "+880175401123",
  whatsapp: "+8801732088210",
  whatsappLink: "https://wa.me/8801732088210",
  email: "foysalahmed.dm23@gmail.com",
  website: "https://foysalit.com",
  services: "https://foysalit.com/#services",
  fiverr: "https://www.fiverr.com/",
  upwork: "https://www.upwork.com/",
};

export function serviceName(key: string): string {
  const normalized = SERVICES_LEGACY[key] || key;
  return (SERVICES as Record<string, ServiceDef>)[normalized]?.name ?? key;
}

export interface ServiceDetail {
  key: ServiceKey;
  headline: string;
  outcome: string;
  deliverables: string[];
  process: string[];
}

export const SERVICE_DETAILS: Record<ServiceKey, ServiceDetail> = {
  seo: {
    key: "seo",
    headline: "Rank for the searches that bring paying customers.",
    outcome: "More organic traffic, more enquiries, less ad spend waste.",
    deliverables: ["Full SEO audit", "On-page optimization", "Content plan", "Monthly ranking report"],
    process: ["Audit the site", "Fix technical + on-page issues", "Publish targeted pages", "Track rankings"],
  },
  social: {
    key: "social",
    headline: "Turn social platforms into a lead engine.",
    outcome: "Consistent reach, brand trust and inbound messages.",
    deliverables: ["Content calendar", "Creative ads/posts", "Hashtag & hook research", "Weekly performance recap"],
    process: ["Audit profiles", "Plan campaigns", "Publish + engage", "Optimize what converts"],
  },
  social_management: {
    key: "social_management",
    headline: "We run the pages so you can run the business.",
    outcome: "Daily posting, replies and a professional brand presence.",
    deliverables: ["Daily posting", "Community replies", "Profile optimization", "Monthly content bank"],
    process: ["Access + brand kit", "Calendar approval", "Daily management", "Monthly review"],
  },
  meta_ads: {
    key: "meta_ads",
    headline: "Facebook & Instagram ads that actually convert.",
    outcome: "Cheaper leads with pixel tracking and retargeting.",
    deliverables: ["Pixel + events", "Campaign build", "Creative testing", "Weekly ROAS report"],
    process: ["Install tracking", "Build audiences", "Launch ads", "Scale winners"],
  },
  google_ads: {
    key: "google_ads",
    headline: "Show up when buyers search you on Google.",
    outcome: "High-intent clicks with conversion tracking.",
    deliverables: ["Keyword map", "Search / PMax setup", "Conversion tracking", "Weekly optimization"],
    process: ["Research keywords", "Build campaigns", "Track conversions", "Cut waste weekly"],
  },
  technical_seo: {
    key: "technical_seo",
    headline: "Make Google love the site — speed, crawl, index.",
    outcome: "Faster pages, cleaner indexation, better Core Web Vitals.",
    deliverables: ["Crawl report", "Speed fixes", "Schema / sitemap", "Indexation cleanup"],
    process: ["Crawl the site", "Prioritize critical issues", "Ship fixes", "Re-measure"],
  },
  youtube_seo: {
    key: "youtube_seo",
    headline: "Get found on YouTube search and suggested videos.",
    outcome: "More views from people already looking for your topic.",
    deliverables: ["Channel audit", "Title / thumbnail system", "Tags & chapters", "Growth plan"],
    process: ["Audit channel", "Optimize top videos", "Publish with SEO pack", "Review analytics"],
  },
  local_seo: {
    key: "local_seo",
    headline: "Own the Google Map Pack in your city.",
    outcome: "More calls and walk-ins from “near me” searches.",
    deliverables: ["GBP optimization", "Citations", "Review system", "Local landing pages"],
    process: ["Claim / clean GBP", "Build citations", "Collect reviews", "Track map rank"],
  },
  gtm_ga4: {
    key: "gtm_ga4",
    headline: "See every click, lead and sale — clearly.",
    outcome: "Reliable GA4 + GTM so ads and SEO can be measured.",
    deliverables: ["GA4 property", "GTM container", "Lead/purchase events", "Looker-ready report"],
    process: ["Map conversions", "Install tags", "QA in debug", "Hand over dashboard"],
  },
  backlinks: {
    key: "backlinks",
    headline: "Earn authority Google cannot ignore.",
    outcome: "Stronger domain trust and better rankings.",
    deliverables: ["Link audit", "Prospect list", "Outreach placements", "Monthly link report"],
    process: ["Audit profile", "Find relevant sites", "Secure placements", "Report links"],
  },
  keyword_research: {
    key: "keyword_research",
    headline: "Know exactly what your customers type into Google.",
    outcome: "A prioritized keyword map for content and ads.",
    deliverables: ["Keyword universe", "Intent grouping", "Competitor gaps", "Content brief pack"],
    process: ["Harvest terms", "Score by intent + difficulty", "Map to pages", "Hand over plan"],
  },
  backlink_index: {
    key: "backlink_index",
    headline: "Make sure your links actually get indexed.",
    outcome: "Published links discovered and counted by Google.",
    deliverables: ["Link inventory", "Index checks", "Re-submission plan", "Status report"],
    process: ["Collect URLs", "Check indexation", "Ping / sitemap", "Report coverage"],
  },
  full_digital_marketing: {
    key: "full_digital_marketing",
    headline: "One team. Every channel. One growth plan.",
    outcome: "SEO + ads + social + tracking working together.",
    deliverables: ["90-day strategy", "Channel mix", "Weekly stand-up", "KPI dashboard"],
    process: ["Discover goals", "Build the stack", "Execute weekly", "Scale what works"],
  },
  web_development: {
    key: "web_development",
    headline: "A fast site that turns visitors into clients.",
    outcome: "Mobile-first website with clear CTAs and lead forms.",
    deliverables: ["Design + build", "Speed pass", "Forms + WhatsApp CTA", "Analytics install"],
    process: ["Scope pages", "Design", "Build + QA", "Launch + train"],
  },
  meta_pixels: {
    key: "meta_pixels",
    headline: "Install Meta Pixel the right way — events included.",
    outcome: "Ads can retarget and measure real leads, not vanity clicks.",
    deliverables: ["Pixel install", "Standard events", "CAPI if available", "Test event proof"],
    process: ["Audit existing tags", "Install pixel", "Fire events", "Verify in Events Manager"],
  },
};
