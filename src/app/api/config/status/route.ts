import { configuredProvider } from "@/lib/mailer";
import { resolveLlmProvider } from "@/lib/email-ai";

export const dynamic = "force-dynamic";

// A-Z configuration status. Reports PRESENCE of each setting (never the secret
// value) so you can see exactly what is configured and what is missing.
function has(...keys: string[]): boolean {
  return keys.some((k) => !!(process.env as any)[k]);
}

const groups = [
  {
    group: "Database",
    items: [
      { key: "APP_DATABASE_URL", label: "Neon database (primary)", set: has("APP_DATABASE_URL") },
      { key: "DATABASE_URL", label: "Database URL (fallback)", set: has("DATABASE_URL") },
    ],
  },
  {
    group: "Email sending (mail robot)",
    items: [
      { key: "GMAIL_USER + GMAIL_APP_PASSWORD", label: "Gmail SMTP (primary sender)", set: has("GMAIL_USER", "GMAIL_APP_PASSWORD"), note: "16-char app password, not an API key" },
      { key: "RESEND_API_KEY", label: "Resend (backup #1)", set: has("RESEND_API_KEY"), note: "this is an API key" },
      { key: "SENDGRID_API_KEY", label: "SendGrid (backup #2)", set: has("SENDGRID_API_KEY") },
      { key: "SMTP_HOST/USER/PASS", label: "Custom SMTP", set: has("SMTP_HOST") },
    ],
  },
  {
    group: "Gmail OAuth (inbox integration)",
    items: [
      { key: "GOOGLE_CLIENT_ID", label: "Google OAuth client ID", set: has("GOOGLE_CLIENT_ID") },
      { key: "GOOGLE_CLIENT_SECRET", label: "Google OAuth client secret", set: has("GOOGLE_CLIENT_SECRET") },
      { key: "GMAIL_SCOPES", label: "Scopes (gmail.modify, gmail.send)", set: true, note: "built-in" },
    ],
  },
  {
    group: "AI providers (any one unlocks LLM)",
    items: [
      { key: "OPENAI_API_KEY", label: "OpenAI", set: has("OPENAI_API_KEY") },
      { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", set: has("ANTHROPIC_API_KEY") },
      { key: "GEMINI_API_KEY / GOOGLE_API_KEY", label: "Google Gemini", set: has("GEMINI_API_KEY", "GOOGLE_API_KEY") },
      { key: "GROQ_API_KEY", label: "Groq", set: has("GROQ_API_KEY") },
      { key: "XAI_API_KEY", label: "xAI (Grok)", set: has("XAI_API_KEY") },
      { key: "DEEPSEEK_API_KEY", label: "DeepSeek", set: has("DEEPSEEK_API_KEY") },
      { key: "MISTRAL_API_KEY", label: "Mistral", set: has("MISTRAL_API_KEY") },
      { key: "COHERE_API_KEY", label: "Cohere", set: has("COHERE_API_KEY") },
      { key: "TOGETHER_API_KEY", label: "Together AI", set: has("TOGETHER_API_KEY") },
      { key: "PERPLEXITY_API_KEY", label: "Perplexity", set: has("PERPLEXITY_API_KEY") },
      { key: "OPENROUTER_API_KEY", label: "OpenRouter", set: has("OPENROUTER_API_KEY") },
      { key: "OLLAMA_BASE_URL", label: "Ollama (local)", set: has("OLLAMA_BASE_URL") },
      { key: "LMSTUDIO_BASE_URL", label: "LM Studio (local)", set: has("LMSTUDIO_BASE_URL") },
    ],
  },
  {
    group: "Integrations",
    items: [
      { key: "BASE44_APP_ID + BASE44_API_KEY", label: "Base44 (DataSheet Hub)", set: has("BASE44_APP_ID", "BASE44_API_KEY") },
      { key: "SHEET_IMPORT_URL", label: "Master Google Sheet", set: has("SHEET_IMPORT_URL") },
      { key: "CRON_SECRET", label: "Cron autopilot secret", set: has("CRON_SECRET") },
    ],
  },
  {
    group: "Deployment",
    items: [
      { key: "APP_BASE_URL", label: "Production base URL", set: has("APP_BASE_URL"), note: process.env.APP_BASE_URL || "" },
      { key: "VERCEL", label: "Deployed on Vercel", set: has("VERCEL"), note: process.env.VERCEL || "sandbox" },
    ],
  },
];

export async function GET() {
  const active = resolveLlmProvider();
  const provider = configuredProvider();
  return Response.json({
    ok: true,
    mailPrimary: provider,
    activeLlm: active ? `${active.provider} (${active.model})` : "built-in engines (no key)",
    groups,
    totalSet: groups.flatMap((g) => g.items).filter((i) => i.set).length,
    totalItems: groups.flatMap((g) => g.items).length,
  });
}
