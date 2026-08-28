// Natural-language command interpreter for the AI Command Center.
// Parses a user's request into a structured query/intent. External-affecting
// actions are returned as previews requiring confirmation (never auto-executed).

import { SERVICES, type ServiceKey } from "./services";

export interface CommandIntent {
  action: "list_leads" | "count" | "generate_outreach" | "create_campaign" | "unknown";
  filters: {
    category?: string; // cold/warm/hot/priority
    service?: ServiceKey;
    missingTracking?: "meta_pixel" | "analytics" | "google_ads";
    overdueFollowup?: boolean;
    stage?: string;
  };
  requiresConfirmation: boolean;
  explanation: string;
}

export function interpretCommand(text: string): CommandIntent {
  const q = text.toLowerCase();
  const filters: CommandIntent["filters"] = {};

  // Category
  for (const cat of ["priority", "hot", "warm", "cold"]) {
    if (q.includes(cat)) filters.category = cat;
  }

  // Service detection
  const serviceKeywords: Record<string, ServiceKey> = {
    seo: "seo",
    "local seo": "local_seo",
    local: "local_seo",
    map: "local_seo",
    "meta ad": "meta_ads",
    facebook: "meta_ads",
    pixel: "meta_pixels",
    "google ad": "google_ads",
    social: "social",
    youtube: "youtube_seo",
    backlink: "backlinks",
    keyword: "keyword_research",
    web: "web_development",
    website: "web_development",
    analytic: "gtm_ga4",
    tracking: "gtm_ga4",
  };
  for (const [kw, key] of Object.entries(serviceKeywords)) {
    if (q.includes(kw)) filters.service = key;
  }

  if (q.includes("no meta pixel") || q.includes("without pixel") || q.includes("no pixel")) {
    filters.missingTracking = "meta_pixel";
  }
  if (q.includes("no analytics") || q.includes("no tracking")) {
    filters.missingTracking = "analytics";
  }
  if (q.includes("overdue") || q.includes("follow-up") || q.includes("follow up")) {
    filters.overdueFollowup = true;
  }

  // Action
  if (q.includes("generate outreach") || q.includes("write email") || q.includes("draft")) {
    return {
      action: "generate_outreach",
      filters,
      requiresConfirmation: true,
      explanation:
        "This will generate draft outreach messages for the matching leads. Messages are created as drafts and require your approval before any send.",
    };
  }
  if (q.includes("create campaign") || q.includes("new campaign") || q.includes("start campaign")) {
    return {
      action: "create_campaign",
      filters,
      requiresConfirmation: true,
      explanation:
        "This will create a new outreach campaign targeting the matching leads. No messages are sent until you activate the campaign.",
    };
  }
  if (q.includes("how many") || q.includes("count")) {
    return { action: "count", filters, requiresConfirmation: false, explanation: describe(filters) };
  }

  return {
    action: "list_leads",
    filters,
    requiresConfirmation: false,
    explanation: describe(filters),
  };
}

function describe(filters: CommandIntent["filters"]): string {
  const parts: string[] = [];
  if (filters.category) parts.push(`${filters.category} leads`);
  else parts.push("leads");
  if (filters.service) parts.push(`needing ${SERVICES[filters.service].name}`);
  if (filters.missingTracking === "meta_pixel") parts.push("without a Meta Pixel");
  if (filters.missingTracking === "analytics") parts.push("without analytics tracking");
  if (filters.overdueFollowup) parts.push("with overdue follow-ups");
  return "Showing " + parts.join(" ") + ".";
}
