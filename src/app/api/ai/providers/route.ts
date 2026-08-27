export const dynamic = "force-dynamic";

// Reports which AI providers are configured (env presence only — never leaks
// secret values). Mirrors the bolt.diy provider list.
interface Provider {
  key: string;
  name: string;
  icon: string;
  env: string;
  configured: boolean;
  kind: "cloud" | "local";
  api: "openai" | "anthropic" | "gemini" | "cohere" | "none";
}

const PROVIDERS: Provider[] = [
  { key: "openai", name: "OpenAI", icon: "🟢", env: "OPENAI_API_KEY", configured: !!process.env.OPENAI_API_KEY, kind: "cloud", api: "openai" },
  { key: "anthropic", name: "Anthropic (Claude)", icon: "🟠", env: "ANTHROPIC_API_KEY", configured: !!process.env.ANTHROPIC_API_KEY, kind: "cloud", api: "anthropic" },
  { key: "gemini", name: "Google (Gemini)", icon: "🔵", env: "GEMINI_API_KEY / GOOGLE_API_KEY", configured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY), kind: "cloud", api: "gemini" },
  { key: "groq", name: "Groq", icon: "⚡", env: "GROQ_API_KEY", configured: !!process.env.GROQ_API_KEY, kind: "cloud", api: "openai" },
  { key: "xai", name: "xAI (Grok)", icon: "🖤", env: "XAI_API_KEY", configured: !!process.env.XAI_API_KEY, kind: "cloud", api: "openai" },
  { key: "deepseek", name: "DeepSeek", icon: "🌀", env: "DEEPSEEK_API_KEY", configured: !!process.env.DEEPSEEK_API_KEY, kind: "cloud", api: "openai" },
  { key: "mistral", name: "Mistral", icon: "🌫️", env: "MISTRAL_API_KEY", configured: !!process.env.MISTRAL_API_KEY, kind: "cloud", api: "openai" },
  { key: "cohere", name: "Cohere", icon: "🟣", env: "COHERE_API_KEY", configured: !!process.env.COHERE_API_KEY, kind: "cloud", api: "cohere" },
  { key: "together", name: "Together AI", icon: "🤝", env: "TOGETHER_API_KEY", configured: !!process.env.TOGETHER_API_KEY, kind: "cloud", api: "openai" },
  { key: "perplexity", name: "Perplexity", icon: "❓", env: "PERPLEXITY_API_KEY", configured: !!process.env.PERPLEXITY_API_KEY, kind: "cloud", api: "openai" },
  { key: "huggingface", name: "HuggingFace", icon: "🤗", env: "HF_API_KEY", configured: !!(process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY), kind: "cloud", api: "openai" },
  { key: "openrouter", name: "OpenRouter", icon: "", env: "OPENROUTER_API_KEY", configured: !!process.env.OPENROUTER_API_KEY, kind: "cloud", api: "openai" },
  { key: "moonshot", name: "Moonshot (Kimi)", icon: "🌙", env: "MOONSHOT_API_KEY", configured: !!process.env.MOONSHOT_API_KEY, kind: "cloud", api: "openai" },
  { key: "bedrock", name: "Amazon Bedrock", icon: "☁️", env: "AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY", configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY), kind: "cloud", api: "none" },
  { key: "ollama", name: "Ollama (local)", icon: "🦙", env: "OLLAMA_BASE_URL", configured: !!process.env.OLLAMA_BASE_URL, kind: "local", api: "openai" },
  { key: "lmstudio", name: "LM Studio (local)", icon: "🧊", env: "LMSTUDIO_BASE_URL", configured: !!process.env.LMSTUDIO_BASE_URL, kind: "local", api: "openai" },
  { key: "openai_like", name: "OpenAI-compatible", icon: "🔌", env: "OPENAI_LIKE_BASE_URL (+_API_KEY)", configured: !!process.env.OPENAI_LIKE_BASE_URL, kind: "local", api: "openai" },
];

export async function GET() {
  const configured = PROVIDERS.filter((p) => p.configured);
  return Response.json({
    ok: true,
    active: configured[0]?.key || null,
    totalConfigured: configured.length,
    providers: PROVIDERS.map(({ configured: _c, ...rest }) => ({ ...rest, configured: _c })),
  });
}
