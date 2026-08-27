import { COMPANY, serviceName } from "./services";
import { insightFor } from "./knowledge";
import { proofFor } from "./portfolio";
import type { DetectedOpportunity } from "./opportunities";

export interface OutreachInput {
  company: string;
  contactName?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  websiteScore?: number | null;
  opportunities: DetectedOpportunity[];
}

export interface OutreachResult {
  subject: string;
  email: string;
  followUp: string;
  whatsapp: string;
}

function greeting(name?: string | null): string {
  if (name && name.trim()) return `Hi ${name.split(" ")[0]},`;
  return "Hi there,";
}

// Personalized outreach generated from the lead's ACTUAL detected opportunities.
// No two leads with different findings get the same message.
export function generateOutreach(input: OutreachInput): OutreachResult {
  const top = [...input.opportunities].sort((a, b) => sevRank(b.severity) - sevRank(a.severity)).slice(0, 3);
  const primary = top[0];
  const primaryService = primary ? serviceName(primary.recommendedService) : "SEO Optimization";

  const findingsLine = top.length
    ? top.map((o) => `• ${o.problem} — ${o.recommendedAction}`).join("\n")
    : "• Opportunities to strengthen your online visibility and lead generation";

  const scoreLine =
    typeof input.websiteScore === "number"
      ? ` We ran a quick audit of ${input.website || "your website"} and it scored ${input.websiteScore}/100.`
      : "";

  const subject = primary
    ? `${input.company}: ${shortProblem(primary.problem)} — a quick idea`
    : `${input.company}: growing your online visibility`;

  const insight = insightFor((input.company.length + (input.industry?.length || 0)) % 6);

  const email = `${greeting(input.contactName)}

I'm reaching out from ${COMPANY.name}. I was looking at ${input.company}${
    input.location ? ` in ${input.location}` : ""
  } and noticed a few opportunities to bring in more customers online.${scoreLine}

Here's what stood out:
${findingsLine}

The good news: these are exactly the kinds of things we fix for ${
    input.industry ? input.industry + " businesses" : "businesses like yours"
  }. Our ${primaryService} service would likely make the biggest immediate difference. ${insight}
${proofFor((input.company.length * 3 + (input.industry?.length || 0)) % 5)} You can see our real client work here: https://sites.google.com/view/foysal-it/portfolio

Would you be open to a quick 15-minute call this week? I can walk you through a free mini-audit — no obligation.

Best regards,
${COMPANY.name}
📧 ${COMPANY.email}  •  📱 WhatsApp: ${COMPANY.whatsapp}
${COMPANY.website}`;

  const followUp = `${greeting(input.contactName)}

Just following up on my note about ${input.company}. I put together a short list of the ${
    top.length || "few"
  } highest-impact improvements${
    primary ? `, starting with ${shortProblem(primary.problem).toLowerCase()}` : ""
  }.

If helpful, I'm happy to send over the full free audit so you can see exactly what we'd recommend. Should I go ahead?

Thanks,
${COMPANY.name}`;

  const whatsapp = `Hi${input.contactName ? " " + input.contactName.split(" ")[0] : ""}! This is ${COMPANY.name}. We reviewed ${input.company}${
    typeof input.websiteScore === "number" ? ` (site scored ${input.websiteScore}/100)` : ""
  } and spotted a few quick wins${
    primary ? `, mainly ${shortProblem(primary.problem).toLowerCase()}` : ""
  }. We can help with ${primaryService}. Want a free mini-audit? 🚀`;

  return { subject, email, followUp, whatsapp };
}

function sevRank(s: string): number {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

function shortProblem(p: string): string {
  return p.replace(/^Weak /, "Weak ").slice(0, 60);
}
