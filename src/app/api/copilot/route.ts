import { db } from "@/db";
import { leads, messages } from "@/db/schema";
import { and, eq, desc, sql, count, isNotNull } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { interpretCommand } from "@/lib/command";
import { SERVICE_LIST } from "@/lib/services";
import { SERVICE_PLAYBOOKS, MARKETING_TOPICS, KNOWLEDGE_REVISION } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

const QUICK = [
  "Give me the daily digest",
  "Which leads need Local SEO?",
  "How to improve my open rate?",
  "Explain Meta Ads service",
  "What is my follow-up cadence?",
  "Top 5 priority leads",
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "");
  const q = text.toLowerCase();

  // 1) Stats / digest
  if (/(digest|summary|status|how many|stats|report)/.test(q) || q.length < 4) {
    const counts = await Promise.all([
      db.select({ c: count() }).from(leads).where(eq(leads.orgId, ORG_ID)),
      db.select({ c: count() }).from(leads).where(and(eq(leads.orgId, ORG_ID), isNotNull(leads.auditedAt))),
      db.select({ c: count() }).from(messages).where(eq(messages.status, "draft")),
      db.select({ c: count() }).from(messages).where(eq(messages.status, "approved")),
      db.select({ c: count() }).from(messages).where(eq(messages.status, "sent")),
    ]);
    const [total, audited, drafts, approved, sent] = counts.map((r) => r[0]);
    const top = await db.select().from(leads).where(eq(leads.orgId, ORG_ID)).orderBy(desc(leads.leadScore)).limit(5);
    return Response.json({
      reply: `Here's your live picture (knowledge base rev. ${KNOWLEDGE_REVISION}):\n\n• Leads: ${total.c} · Audited: ${audited.c}\n• Emails: ${drafts.c} drafts, ${approved.c} approved, ${sent.c} sent\n\nTop leads right now:\n${top.map((l, i) => `${i + 1}. ${l.company} — score ${l.leadScore} (${l.scoreCategory})${l.industry ? " · " + l.industry : ""}`).join("\n")}\n\nWant me to audit new leads, draft outreach, or explain a playbook?`,
      quick: QUICK,
    });
  }

  // 2a) Portfolio / proof questions
  if (/(portfolio|proof|case study|our work|client work|result)/.test(q)) {
    const { CASE_STUDIES, PORTFOLIO_LINKS } = await import("@/lib/portfolio");
    return Response.json({
      reply: `Our real, documented client work:\n\n${CASE_STUDIES.slice(0, 6).map((c) => `• ${c.client} — ${c.work}`).join("\n")}\n\nProofs (Drive folders, backlink sheet, SEO plan doc, sites portfolio):\n• ${PORTFOLIO_LINKS.driveProofs}\n• ${PORTFOLIO_LINKS.drivePortfolio}\n• ${PORTFOLIO_LINKS.sitesPortfolio}\n\nOpen /portfolio in the app for full details. Every outreach email includes one of these proof lines.`,
      quick: ["Daily digest", "Find leads for Local SEO", "Improve my open rate"],
    });
  }

  // 2) Marketing knowledge topic
  const topic = MARKETING_TOPICS.find((t) => t.match.some((m) => q.includes(m)));
  if (topic) {
    return Response.json({
      reply: `${topic.title}\n\n${topic.answer.map((a) => "• " + a).join("\n")}\n\nWant me to apply this to your next 10 outreach drafts?`,
      quick: ["Apply to next 10 drafts", "Show top 5 priority leads", "Daily digest"],
    });
  }

  // 3) Service playbook (per category) — explicit phrases first, then names
  const PHRASES: [RegExp, string][] = [
    [/local seo|google maps|map rank|gbp|google business/, "local_seo"],
    [/technical seo|core web vitals|page speed|technical/, "technical_seo"],
    [/youtube/, "youtube_seo"],
    [/meta pixel|pixel/, "meta_pixels"],
    [/meta ads|facebook ads|instagram ads/, "meta_ads"],
    [/google ads/, "google_ads"],
    [/social media management/, "social_management"],
    [/social media marketing|social/, "social"],
    [/gtm|ga4|analytics|tag manager/, "gtm_ga4"],
    [/backlink index/, "backlink_index"],
    [/backlink/, "backlinks"],
    [/keyword/, "keyword_research"],
    [/web dev|website development|web development/, "web_development"],
    [/full digital|end to end|a to z marketing|all in one marketing/, "full_digital_marketing"],
    [/\bseo\b/, "seo"],
  ];
  const phraseHit = PHRASES.find(([re]) => re.test(q))?.[1];
  const svc = phraseHit
    ? SERVICE_LIST.find((s) => s.key === phraseHit)
    : SERVICE_LIST.find((s) => q.includes(s.name.toLowerCase()) || q.includes(s.short.toLowerCase()));
  const playbook = svc ? SERVICE_PLAYBOOKS[svc.key] : undefined;
  if (playbook && svc) {
    return Response.json({
      reply: `📚 ${playbook.title}\n${playbook.summary}\n\n${playbook.points.map((p) => "• " + p).join("\n")}\n\nFull details: open Services → ${svc.name}. I can also find leads matching this service and draft outreach.`,
      quick: [`Find leads for ${svc.short}`, "Daily digest", "Top 5 priority leads"],
    });
  }

  // 4) Lead queries → command interpreter
  const intent = interpretCommand(text);
  if (intent.action === "list_leads" || intent.action === "count") {
    const conds = [eq(leads.orgId, ORG_ID)];
    if (intent.filters.category) conds.push(eq(leads.scoreCategory, intent.filters.category));
    if (intent.filters.service) conds.push(sql`${leads.recommendedServices} @> ${JSON.stringify([intent.filters.service])}::jsonb`);
    const rows = await db.select().from(leads).where(and(...conds)).orderBy(desc(leads.leadScore)).limit(5);
    return Response.json({
      reply: `${intent.explanation}\n\n${rows.map((l, i) => `${i + 1}. ${l.company} — ${l.leadScore} (${l.scoreCategory})${l.email ? " · " + l.email : ""}${l.location ? " · " + l.location : ""}`).join("\n")}\n\nOpen Leads to filter, or ask me to draft outreach for these.`,
      quick: ["Draft outreach for these", "Run audits on new leads", "Daily digest"],
    });
  }

  // 5) Scoring / audit explanations
  if (/(audit|score|why (is|was))/.test(q) && /(lead|score|audit)/.test(q)) {
    const top = await db.select().from(leads).where(eq(leads.orgId, ORG_ID)).orderBy(desc(leads.leadScore)).limit(3);
    return Response.json({
      reply: `Here's how I score, and your top 3:\n\n• Contactability (email/phone) + service-fit from real audit findings + website gap.\n${top.map((l) => `• ${l.company}: ${l.leadScore} (${l.scoreCategory}) — ${(l.scoreReasons || []).slice(0, 2).join(" | ")}`).join("\n")}\n\nOpen any lead → Score Breakdown for the full reasoning.`,
      quick: ["Daily digest", "Find leads for Local SEO", "How to improve open rate?"],
    });
  }

  // 6) Default: helpful router
  return Response.json({
    reply: `I'm the FOYSAL Copilot — one brain for your whole operation (rev. ${KNOWLEDGE_REVISION}). I can:\n\n• Read your live numbers (leads, audits, emails)\n• Find leads by service ("leads that need Meta Ads")\n• Teach you playbooks (open rate, follow-up cadence, objections, LinkedIn)\n• Explain any of our 15 services\n\nWhat do you want to do?`,
    quick: QUICK,
  });
}
