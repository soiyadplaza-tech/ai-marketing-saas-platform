// FOYSAL IT marketing brain — 30+ years of field-tested digital marketing
// playbooks used by the Copilot, outreach writer and lead advice panel.
// Built-in knowledge (no external key required). Refresh date below is the
// knowledge revision; add new playbooks here to "recharge" the brain.

export const KNOWLEDGE_REVISION = "2026-08";

export interface Playbook {
  title: string;
  summary: string;
  points: string[];
}

export const SERVICE_PLAYBOOKS: Record<string, Playbook> = {
  seo: {
    title: "SEO (30-year playbook)",
    summary: "Rank where buyers already search; compound traffic without paying per click.",
    points: [
      "Fix crawl + index first — Google can't rank what it can't read.",
      "One H1, tight titles (30–60 chars), descriptions with a CTA.",
      "Topical clusters: 1 pillar page + 6–10 supporting pages.",
      "Local businesses must pair SEO with Google Business Profile.",
      "Track: impressions → clicks → enquiries, not just position.",
    ],
  },
  technical_seo: {
    title: "Technical SEO",
    summary: "Speed and indexation are the foundation of every ranking win.",
    points: [
      "Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.",
      "Mobile-first: viewport, tap targets, no horizontal scroll.",
      "Clean canonical + sitemap + robots; fix 4xx chains.",
      "Compress images to WebP/AVIF, lazy-load below the fold.",
      "Add schema (LocalBusiness, FAQ, Product) for rich results.",
    ],
  },
  local_seo: {
    title: "Local SEO & Map Ranking",
    summary: "Win the map pack — the highest-converting local real estate.",
    points: [
      "NAP must be identical across site, GBP and top 20 citations.",
      "GBP: right categories, weekly posts, photos, Q&A seeded.",
      "Reviews: ask after purchase via SMS/email; reply to all.",
      "Embed map + local landing pages per city.",
      "Rank check weekly for 'category + city' terms.",
    ],
  },
  keyword_research: {
    title: "Keyword Research",
    summary: "Map money, not traffic. Intent beats volume.",
    points: [
      "Cluster by intent: informational / commercial / transactional.",
      "Buyer-intent long-tails convert 5–10x more than head terms.",
      "Mine Google's own data: PAA, People-also-search, related.",
      "Check SERP intent — videos/forums dominate means adjust angle.",
      "One primary keyword per page; keep title + H1 aligned.",
    ],
  },
  meta_ads: {
    title: "Meta Ads",
    summary: "Retargeting warm visitors is the cheapest lead source online.",
    points: [
      "Pixel + CAPI first — no tracking, no retargeting, no ROAS.",
      "Structure: 3 audiences (Lookalike, Retargeting, Cold).",
      "Creative > targeting: test 3 hooks per week.",
      "Offer > ad: free audit / free session beats generic discount.",
      "KPIs: CPL and cost per booked call, not reach.",
    ],
  },
  google_ads: {
    title: "Google Ads",
    summary: "Capture demand at the moment of intent.",
    points: [
      "Search for buyer-intent keywords; negative keywords weekly.",
      "Track conversions — cost-per-conversion is the only budget dial.",
      "Ad schedule by your business hours for local services.",
      "PMax for e-commerce with clean feeds.",
      "Quality Score: tight ad groups (5–10 keywords each).",
    ],
  },
  social: {
    title: "Social Media Marketing",
    summary: "Consistency + hooks build an audience that buys.",
    points: [
      "80% value, 20% offer — but always end with a hook.",
      "First 3 seconds decide: lead with the problem, not the logo.",
      "Batch 2 weeks of content in one session.",
      "Reply to every comment in the first hour.",
      "Repurpose top posts 3x with different hooks.",
    ],
  },
  social_management: {
    title: "Social Media Management",
    summary: "Run the brand daily so it never goes quiet.",
    points: [
      "Publish 5x/week minimum on the primary platform.",
      "Content calendar reviewed every Friday.",
      "DMs answered within 2 hours — that's a sales channel.",
      "Monthly recap: reach, saves, DMs, new followers.",
      "Brand voice guide so everything sounds like one person.",
    ],
  },
  youtube_seo: {
    title: "YouTube SEO",
    summary: "The #2 search engine ranks for how-to buying questions.",
    points: [
      "Titles = search query, not clever wordplay.",
      "Thumbnail: face + 3 words + contrast.",
      "First 30s: state the payoff, then deliver it.",
      "Chapters + description keywords + pinned comment CTA.",
      "Post 2x/week minimum for 90 days before judging.",
    ],
  },
  gtm_ga4: {
    title: "GTM & GA4 Setup",
    summary: "If you can't measure it, you can't scale it.",
    points: [
      "Define conversion events before any ad spend: form, call, WhatsApp.",
      "GTM for all tags — no hard-coded scripts.",
      "Test every event in Preview mode before publish.",
      "Dashboards: traffic source → conversion, weekly.",
      "Data retention set to 14 months.",
    ],
  },
  backlinks: {
    title: "Backlink Services",
    summary: "Authority is earned relevance — one great link > fifty spam links.",
    points: [
      "Audit existing profile first; disavow toxic spikes.",
      "Target: local news, industry directories, partner sites, podcasts.",
      "Digital PR: data studies and free tools earn links naturally.",
      "Anchor text stays natural (mostly branded).",
      "Report: referring domains + follow/noindex monthly.",
    ],
  },
  backlink_index: {
    title: "Backlink Index",
    summary: "Unindexed links are invisible — make Google see them.",
    points: [
      "Check every published link in site: search and index tools.",
      "Ping search engines after publication; re-check after 7 days.",
      "Fix broken backlinks — each is lost authority.",
      "Keep a live spreadsheet: URL, date, status, follow.",
      "Alert when a referring domain drops off.",
    ],
  },
  web_development: {
    title: "Web Development",
    summary: "The website is your 24/7 salesperson.",
    points: [
      "One page, one goal — hero promise + one CTA above the fold.",
      "Click to WhatsApp on mobile: 40%+ of leads won't fill a form.",
      "Load under 3s on 4G — every extra second loses ~7% conversions.",
      "Trust block: logo, phone, reviews, address.",
      "Analytics from day one, forms wired to email + SMS.",
    ],
  },
  meta_pixels: {
    title: "Meta Pixel",
    summary: "The pixel is the bridge between website and audience.",
    points: [
      "Install pixel + test events before any ad dollar.",
      "Standard events: ViewContent, Lead, Purchase.",
      "CAPI (server-side) recovers 20–40% lost mobile signals.",
      "Duplicate pixel IDs are the #1 silent failure — verify ID once.",
      "Warm pixel with landing page traffic before retargeting.",
    ],
  },
  full_digital_marketing: {
    title: "Full Digital Marketing",
    summary: "One plan, every channel, measured against revenue.",
    points: [
      "Week 0: audit everything + baseline KPIs.",
      "Week 1: fix tracking — you can't optimize the invisible.",
      "Weeks 2–4: SEO + ads + content running in parallel.",
      "Weekly: CPL review; monthly: CAC vs LTV.",
      "Quarterly: double down on the channel with best CAC.",
    ],
  },
};

export const MARKETING_TOPICS: { match: string[]; title: string; answer: string[] }[] = [
  {
    match: ["open rate", "subject line", "subject"],
    title: "Email open-rate playbooks",
    answer: [
      "Subject lines: 3–7 words, one curiosity gap, no all-caps, no spam words (free!!, $$$).",
      "Send Tue–Thu 9–11am in the lead's time zone; test one day off-pattern per month.",
      "Preheader is free space — use it as a second subject line.",
      "Benchmarks: B2B cold 20–35% open is normal; above 45% is great.",
      "Deliverability: SPF/DKIM/DMARC on foysalit.com + clean list + unsubscribe link always.",
    ],
  },
  {
    match: ["follow up", "follow-up", "sequence", "cadence"],
    title: "Follow-up cadence that books calls",
    answer: [
      "80% of sales happen after the 5th touch — most stop at 2.",
      "Cadence that works: Day 1 intro → Day 3 value → Day 7 proof (case study) → Day 12 direct ask → Day 15 breakup.",
      "Each follow-up adds something new; never 'just checking in'.",
      "Stop sequence on reply or opt-out immediately.",
      "Track per-step reply rate to know which message sells.",
    ],
  },
  {
    match: ["objection", "rejection", "no interest", "too expensive"],
    title: "Objection handling",
    answer: [
      "‘Too expensive’ → reframe to cost of NOT fixing: ‘What does one lost customer cost vs the monthly plan?’",
      "‘We already have an agency’ → ask for their last 3 reports; offer a free 2nd-opinion audit.",
      "‘Send me info’ → send the audit PDF + a 15-min calendar link, same day.",
      "Stay silent after your value statement — whoever pitches first loses leverage.",
      "Every ‘no’ is a data point: log the reason, refine the next message.",
    ],
  },
  {
    match: ["cold email", "cold mail", "outreach reply", "reply rate"],
    title: "Cold email rules (field-tested)",
    answer: [
      "Line 1 = their problem, not you. ‘I noticed your site has no Meta Pixel…’",
      "Under 120 words, one idea, one CTA (15-min call or free audit).",
      "Personalize with one real detail from the audit — that's the whole game.",
      "Signature: name + WhatsApp + one portfolio line.",
      "Benchmarks: 10–25% reply for warm-fit leads; 40%+ with a real audit attached.",
    ],
  },
  {
    match: ["benchmark", "roi", "roas", "conversion rate"],
    title: "Channel benchmarks",
    answer: [
      "Landing page conversion: 2–5% average; 10%+ with a strong offer.",
      "Meta CPL for services: $1–$8 in South Asia; above $15 re-check creative.",
      "Google Ads CPC for commercial SEO terms: $0.3–$2 locally.",
      "WhatsApp response >90% within an hour — fastest channel for local.",
      "SEO pays back in month 4–6; ads in week 1–2. Run both, different jobs.",
    ],
  },
  {
    match: ["linkedin", "social selling"],
    title: "LinkedIn outreach",
    answer: [
      "Connect with a 1-line note: their company + one specific reason.",
      "Day 1 after accept: value (share an audit insight), never a pitch.",
      "Day 4: short case study with numbers.",
      "Profile = landing page: headline = ‘I help [X] get [Y]’.",
      "Post 3x/week: 1 insight, 1 case study, 1 personal/behind-the-scenes.",
    ],
  },
];

// Rotating professional insight lines appended to outreach (human + AI tone).
export const OUTREACH_INSIGHTS = [
  "Most local businesses lose their top 3 search results because of technical gaps we fix in the first two weeks.",
  "Our clients typically see 30–60% more enquiries within 90 days after the audit fixes are live.",
  "We only recommend the one service that will move your revenue first — then we expand from there.",
  "Businesses with proper tracking close 2x more deals because every call and form is measured.",
  "We built a 30-year playbook for exactly this niche — I'd love to share the one page that matters to you.",
  "A free 15-page audit is ours to prepare; the only cost of skipping it is the customers going to the competitor.",
];

export function insightFor(seed: number): string {
  return OUTREACH_INSIGHTS[seed % OUTREACH_INSIGHTS.length];
}
