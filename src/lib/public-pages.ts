export type PublicPageKey =
  | "about"
  | "features"
  | "solutions"
  | "ai"
  | "agency-os"
  | "business-os"
  | "pricing"
  | "enterprise"
  | "security"
  | "documentation"
  | "faq"
  | "free-trial";

export interface PublicPageData {
  key: PublicPageKey;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  sections: { title: string; body: string; items?: string[] }[];
  cta: string;
}

export const PUBLIC_PAGES: Record<PublicPageKey, PublicPageData> = {
  about: {
    key: "about",
    eyebrow: "About FOYSAL IT OS",
    title: "One operating system for leads, marketing, meetings and automation.",
    description: "FOYSAL IT OS combines agency operations, lead intelligence, CRM, NOVA AI translation, outreach automation and owner control in one connected platform.",
    bullets: ["Built for agencies and service businesses", "AI-first but never fake", "Multi-tenant workspaces", "Owner-level monitoring and control"],
    sections: [
      { title: "Our mission", body: "Help businesses turn raw data, meetings and conversations into qualified opportunities and revenue." },
      { title: "Core promise", body: "Every visible action is backed by real data, real database writes, real provider calls, or an honest Not Configured state." },
      { title: "Who it serves", body: "Digital agencies, consultants, sales teams, service businesses, multilingual teams and client-facing operators." },
    ],
    cta: "Start with your first lead import",
  },
  features: {
    key: "features",
    eyebrow: "Platform Features",
    title: "Everything needed to run a modern AI-powered agency.",
    description: "From Google Sheet imports to AI audits, outreach, NOVA meetings, reports and super-owner control — every module is connected.",
    bullets: ["Lead Intelligence", "Website & SEO Audit", "AI Outreach", "NOVA Meeting Translator", "CRM Pipeline", "Admin Control Center"],
    sections: [
      { title: "AI Lead Intelligence", body: "Import thousands of contacts, map fields, enrich profiles, audit websites and score leads from 0–100." },
      { title: "NOVA AI", body: "Real browser-based speech recognition, translation and speech output for Bangla ↔ international meetings." },
      { title: "Automation", body: "Daily AI pilot: audit, draft, approve and send through real Gmail/SMTP with caps and safety rules." },
      { title: "Reports", body: "Professional lead reports, website audit reports, weekly notes, monthly status and CSV exports." },
    ],
    cta: "Explore the dashboard",
  },
  solutions: {
    key: "solutions",
    eyebrow: "Solutions",
    title: "Solutions for agencies, businesses, sales teams and global meetings.",
    description: "Use FOYSAL IT OS as a CRM, marketing operations platform, meeting translator, client portal and reporting hub.",
    bullets: ["For agencies", "For sales teams", "For local businesses", "For multilingual meetings", "For client reporting"],
    sections: [
      { title: "Agency Growth", body: "Manage leads, clients, audits, proposals, campaigns, reports and team workflow in one place." },
      { title: "Multilingual Sales", body: "Use NOVA AI to understand international clients when language blocks business communication." },
      { title: "Client Transparency", body: "Show reports, tasks, progress, files and meeting summaries in a clean professional flow." },
    ],
    cta: "Find your use case",
  },
  ai: {
    key: "ai",
    eyebrow: "NOVA AI Layer",
    title: "One AI layer across leads, meetings, writing, SEO and reports.",
    description: "The platform uses real configured providers where available, and honest built-in engines where no key is required.",
    bullets: ["AI Copilot", "AI Lead Scoring", "AI Email Assistant", "Voice Translation", "Meeting Summary", "SEO Recommendations"],
    sections: [
      { title: "Provider architecture", body: "OpenAI, Claude, Gemini, Groq, DeepSeek, OpenRouter and local providers can be configured without rewriting the app." },
      { title: "No fake AI", body: "If a real provider is missing, the UI clearly says Not Configured. Built-in tools still run real deterministic analysis and real translation APIs." },
      { title: "NOVA Auto", body: "The system routes work to the best available tool: translation, summarization, outreach, scoring, report writing or meeting intelligence." },
    ],
    cta: "Open AI Providers",
  },
  "agency-os": {
    key: "agency-os",
    eyebrow: "Agency OS",
    title: "Run client acquisition and delivery from the same workspace.",
    description: "Agency owners get lead generation, service matching, audits, content, campaigns, reports and client workflows.",
    bullets: ["Lead generation", "Client pipeline", "Task delivery", "Reports", "Team roles", "Client portal foundation"],
    sections: [
      { title: "Acquire", body: "AI finds service opportunities, scores leads and writes human outreach." },
      { title: "Deliver", body: "Tasks, audits, notes, reports and activity timelines keep delivery clear." },
      { title: "Measure", body: "Track campaigns, follow-ups, conversions, won/lost pipeline and revenue analytics." },
    ],
    cta: "Build your agency workspace",
  },
  "business-os": {
    key: "business-os",
    eyebrow: "Business OS",
    title: "A configurable business engine for services, clients and operations.",
    description: "Not separate apps for every industry — one configurable operating system with modules you enable as needed.",
    bullets: ["Business setup", "Customers", "Products/services", "Orders foundation", "Finance foundation", "Automation"],
    sections: [
      { title: "Configurable modules", body: "Start with leads and CRM, then enable files, reports, meetings, billing, products and automations." },
      { title: "Owner oversight", body: "The super owner sees system health, usage, security and member activity without exposing passwords or secrets." },
    ],
    cta: "Configure the system",
  },
  pricing: {
    key: "pricing",
    eyebrow: "Pricing & Subscription",
    title: "Plans for testing, agencies and enterprise operations.",
    description: "Pricing is configurable. The current app includes Free Trial, Starter, Professional, Agency and Enterprise plan foundations.",
    bullets: ["Free Trial", "Starter", "Professional", "Agency", "Enterprise", "Usage limits"],
    sections: [
      { title: "Free Trial", body: "Try lead import, audits, CRM, reports and NOVA translator with limited usage." },
      { title: "Agency", body: "For teams managing many leads, clients, automations and reporting workflows." },
      { title: "Enterprise", body: "For custom domains, dedicated configuration, stronger security and provider governance." },
    ],
    cta: "Start free trial",
  },
  enterprise: {
    key: "enterprise",
    eyebrow: "Enterprise",
    title: "Designed for scale, control and secure operations.",
    description: "Enterprise customers need role-based access, monitoring, audit logs, provider control, integration status and strong data boundaries.",
    bullets: ["RBAC", "Tenant isolation", "Audit logs", "Provider failover", "Domain config", "Security events"],
    sections: [
      { title: "Secure operations", body: "Password hashes, encrypted tokens, secure sessions and server-side provider secrets keep sensitive data protected." },
      { title: "Admin governance", body: "Owner can monitor usage, errors, members, workspaces, integrations and feature flags." },
    ],
    cta: "Contact enterprise",
  },
  security: {
    key: "security",
    eyebrow: "Security",
    title: "No plaintext passwords. No leaked secrets. No fake access.",
    description: "Security is built into every module: auth, RBAC, tenant isolation, safe OAuth, suppression lists, real error states and secure provider configs.",
    bullets: ["Scrypt password hashing", "Server-side secrets", "Admin cannot view passwords", "OAuth token encryption", "Audit trails", "Role checks"],
    sections: [
      { title: "Password safety", body: "Admins can reset or revoke access but cannot see original passwords. Passwords are never stored in plaintext." },
      { title: "Provider safety", body: "API keys and OAuth tokens are never exposed in frontend JavaScript and are masked in admin screens." },
      { title: "Data boundaries", body: "Members only access their own workspace. Super owner can monitor authorized platform data." },
    ],
    cta: "Review security center",
  },
  documentation: {
    key: "documentation",
    eyebrow: "Documentation",
    title: "Setup and operating guides for FOYSAL IT OS.",
    description: "Clear docs for import, Gmail, Netlify domain, Google OAuth, AI providers, NOVA AI and daily automation.",
    bullets: ["Google Sheet import", "Gmail setup", "Domain setup", "AI providers", "Daily autopilot", "NOVA AI"],
    sections: [
      { title: "Quick start", body: "Create account, import leads, run audit, generate outreach, approve, send and track pipeline." },
      { title: "Domain", body: "Netlify is active. Custom PublicVM domain requires adding it in Netlify Domain management and copying DNS records." },
      { title: "Gmail", body: "SMTP works with a 16-character Google app password. Gmail OAuth inbox requires Google Client ID/Secret and redirect URI." },
    ],
    cta: "Open help center",
  },
  faq: {
    key: "faq",
    eyebrow: "FAQ",
    title: "Frequently asked questions.",
    description: "Answers about domain, email, AI, leads, permissions, Google Meet and NOVA AI.",
    bullets: ["Domain not active?", "Does email send without API key?", "Is NOVA real?", "Can users see each other's data?", "What needs setup?"],
    sections: [
      { title: "Does email send without an API key?", body: "Yes, Gmail SMTP uses a Google app password, not an API key. Resend/SendGrid use API keys as backups." },
      { title: "Is NOVA AI real?", body: "Yes. Browser speech recognition + real MyMemory translation + browser TTS work now. Open-ended AI needs a configured model provider." },
      { title: "Why is the custom domain not active?", body: "The Netlify project is active. The PublicVM domain must be added in Netlify Domain management, then DNS records copied to DNSExit/PublicVM." },
      { title: "Can users see each other's data?", body: "No. Members are isolated by workspace. The super owner can monitor authorized platform-level data." },
    ],
    cta: "Ask support",
  },
  "free-trial": {
    key: "free-trial",
    eyebrow: "Free Trial",
    title: "Start your FOYSAL IT OS trial.",
    description: "Create a member workspace, import your first leads, run audits, test NOVA AI and see the full operating system flow.",
    bullets: ["Private member workspace", "Lead import", "Website audit", "NOVA translator", "AI Copilot", "Reports"],
    sections: [
      { title: "What is included", body: "Core CRM, lead management, NOVA AI translation, reports and selected automations." },
      { title: "Upgrade path", body: "Professional, Agency and Enterprise plans can be configured once billing provider is connected." },
    ],
    cta: "Create free account",
  },
};
