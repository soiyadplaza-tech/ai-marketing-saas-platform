import type { AuditResult } from "./audit";
import type { DetectedOpportunity } from "./opportunities";

export interface LeadLike {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
}

export interface ScoreResult {
  score: number;
  category: "cold" | "warm" | "hot" | "priority";
  reasons: string[];
  websiteScore: number | null;
  seoScore: number | null;
  localSeoScore: number | null;
  socialScore: number | null;
}

export function categorize(score: number): ScoreResult["category"] {
  if (score >= 80) return "priority";
  if (score >= 60) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

// Higher score = more valuable & more actionable opportunity for FOYSAL IT.
// The score rewards: contactability, service-fit (i.e. detected problems we can
// fix), and business relevance. A perfect website means fewer opportunities.
export function scoreLead(
  lead: LeadLike,
  audit: AuditResult | null,
  ops: DetectedOpportunity[]
): ScoreResult {
  const reasons: string[] = [];
  let score = 0;

  // Contactability (max 25)
  if (lead.email) {
    score += 12;
    reasons.push("Has a contact email (+12) — reachable for outreach.");
  } else {
    reasons.push("No email on file — reduces outreach potential.");
  }
  if (lead.phone) {
    score += 8;
    reasons.push("Phone number available (+8).");
  }
  if (lead.website) {
    score += 5;
    reasons.push("Website available for audit (+5).");
  }

  // Business relevance (max 15)
  if (lead.industry) {
    score += 8;
    reasons.push(`Industry known: ${lead.industry} (+8).`);
  }
  if (lead.location) {
    score += 7;
    reasons.push(`Location known: ${lead.location} (+7) — enables Local SEO fit.`);
  }

  // Service fit from detected opportunities (max 45)
  if (ops.length > 0) {
    const high = ops.filter((o) => o.severity === "high").length;
    const med = ops.filter((o) => o.severity === "medium").length;
    const fit = Math.min(45, high * 12 + med * 6 + ops.length * 2);
    score += fit;
    reasons.push(
      `${ops.length} service opportunities detected (${high} high, ${med} medium) — strong service fit (+${fit}).`
    );
  } else if (audit) {
    reasons.push("Few problems detected — lower service-fit for now.");
  }

  // Website audit quality signal (max 15) — worse site = more we can help
  let websiteScore: number | null = null;
  let seoScore: number | null = null;
  let localSeoScore: number | null = null;
  let socialScore: number | null = null;
  if (audit && audit.ok) {
    websiteScore = audit.overallScore;
    seoScore = audit.scores.onpage;
    localSeoScore = audit.scores.local;
    socialScore = audit.scores.social;
    const gap = 100 - audit.overallScore; // bigger gap = more opportunity
    const gapPts = Math.round((gap / 100) * 15);
    score += gapPts;
    reasons.push(
      `Website audit score ${audit.overallScore}/100 — ${gap}% improvement headroom (+${gapPts}).`
    );
  } else if (audit && !audit.ok) {
    reasons.push("Website could not be audited — verify the URL.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const category = categorize(score);
  reasons.unshift(`Overall lead score: ${score}/100 — ${category.toUpperCase()}.`);

  return { score, category, reasons, websiteScore, seoScore, localSeoScore, socialScore };
}

// Quick pre-audit score based only on data completeness.
export function baselineScore(lead: LeadLike): ScoreResult {
  return scoreLead(lead, null, []);
}
