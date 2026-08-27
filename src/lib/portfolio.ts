// FOYSAL IT portfolio — real client work pulled from the shared Drive folders,
// Google Sites portfolio, backlink sheet and the SEO plan document.

export interface CaseStudy {
  id: string;
  client: string;
  location?: string;
  work: string;
  details: string;
  source?: string;
  tag: string;
}

export const PORTFOLIO_LINKS = {
  driveProofs: "https://drive.google.com/drive/folders/1Ybasgs8GP3tzCZNGEsf_uOLwMlE9n5f8?usp=sharing",
  drivePortfolio: "https://drive.google.com/drive/folders/17LXE5pG6i18GYc8TGn14aNz0QotMZ0Yg?usp=sharing",
  backlinkSheet: "https://docs.google.com/spreadsheets/d/1EPbMr6AxsyEQTGFyxLJWXzq_P3qpV872WrWzlIbSZUY/edit?usp=sharing",
  seoPlanDoc: "https://docs.google.com/document/d/1Vm6Gs5kLNcXuhH7-kPaLfuaZdTnzaCEltOdfg0axElQ/edit?usp=drivesdk",
  sitesPortfolio: "https://sites.google.com/view/foysal-it/portfolio",
  website: "https://sites.google.com/view/foysal-it/",
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "desert-light",
    client: "Desert Light Studio",
    location: "Dubai, UAE",
    work: "1-Month SEO Plan + SWOT + Competitor Analysis",
    details:
      "Full 30-day SEO roadmap for desertlightstudio.com targeting the US market: SWOT (4 quadrants), 30+ US competitor analysis, keyword strategy, week-by-week plan, content calendar, link-building plan, local SEO and technical SEO priorities with KPIs.",
    source: PORTFOLIO_LINKS.seoPlanDoc,
    tag: "SEO Plan",
  },
  {
    id: "health-traffic",
    client: "Health Website (US Market)",
    work: "Website Traffic Growth Case Study",
    details:
      "Documented traffic-growth case study: baseline → on-page fixes → content + tracking → measured traffic lift. Full PDF in the My Portfolio Drive folder.",
    source: PORTFOLIO_LINKS.drivePortfolio,
    tag: "Case Study",
  },
  {
    id: "woocommerce",
    client: "Complete WooCommerce Project",
    work: "End-to-End WooCommerce Build",
    details:
      "Complete e-commerce project deliverable covering store setup, product structure and conversion basics — full PDF in the My Portfolio Drive folder.",
    source: PORTFOLIO_LINKS.drivePortfolio,
    tag: "Web Development",
  },
  {
    id: "daralibda",
    client: "Dar al Imdad Home Furnishing",
    location: "daralibdaahomefurnishing.com",
    work: "Full Site Audit",
    details: "Professional website audit with prioritized on-page and technical fixes for a home-furnishing brand.",
    source: PORTFOLIO_LINKS.driveProofs,
    tag: "Site Audit",
  },
  {
    id: "femecart",
    client: "FEMECart",
    location: "femecart.com",
    work: "Audit Sheet",
    details: "Detailed audit sheet covering SEO health, performance and quick wins for the FEMECart store.",
    source: PORTFOLIO_LINKS.driveProofs,
    tag: "Audit",
  },
  {
    id: "blue-reserve",
    client: "Blue Reserve",
    work: "Google Ads — Keyword & Ad Copy + Campaign Setup",
    details:
      "Keyword research and ad copy for Blue Reserve, plus a full Google Ads campaign setup & report sample and GTM/GA4 (pixel) setup proofs.",
    source: PORTFOLIO_LINKS.driveProofs,
    tag: "Google Ads",
  },
  {
    id: "agriculturalgov",
    client: "agriculturalgov.br.com (IMRAN TEAM)",
    work: "440 Profile Backlinks",
    details: "440 high-quality profile backlinks delivered and documented in the campaign proofs folder.",
    source: PORTFOLIO_LINKS.driveProofs,
    tag: "Backlinks",
  },
  {
    id: "shanhaoundies",
    client: "Shan Haoundies",
    location: "shanhaoundies.com",
    work: "Keyword Research",
    details: "Complete keyword research package: volume, intent, and prioritized content map.",
    source: PORTFOLIO_LINKS.driveProofs,
    tag: "Keyword Research",
  },
  {
    id: "backlink-portfolio",
    client: "High-Quality Mix Backlink Portfolio",
    work: "Ongoing Backlink Campaigns",
    details:
      "Live backlink placements tracked in a master sheet — including authority profiles (e.g. Coursera placements) with live status reporting.",
    source: PORTFOLIO_LINKS.backlinkSheet,
    tag: "Backlinks",
  },
  {
    id: "nishu4shaku",
    client: "Nishu4shaku Digital Marketing Agency",
    work: "Weekly Reporting",
    details: "Weekly performance reporting system for an agency client, delivered on a fixed cadence.",
    source: PORTFOLIO_LINKS.sitesPortfolio,
    tag: "Reporting",
  },
];

// Short, human lines used inside outreach emails (rotated).
export const OUTREACH_PROOF_LINES = [
  "Recently we built a 30-day SEO plan with SWOT and 30+ competitor analysis for a Dubai photography studio targeting the US market.",
  "Our latest case study shows a health website growing traffic after our on-page + tracking fixes — happy to share the numbers with you.",
  "We recently delivered 440 quality profile backlinks for a client and set up a full Google Ads + GTM/GA4 campaign for another.",
  "Our team audits sites like yours weekly — full audit sheets, keyword research and backlink campaigns are our daily work.",
  "We run Google Ads, Meta Pixel, GA4/GTM setup and local SEO for clients across the US, UAE and Bangladesh.",
];

export function proofFor(seed: number): string {
  return OUTREACH_PROOF_LINES[seed % OUTREACH_PROOF_LINES.length];
}
