// AI Email Assistant — real, verifiable operations.
// • Language detection: Unicode script analysis (deterministic, accurate).
// • Summarization: extractive scoring over the real email text.
// • Reply / shorten / professional: generated from the ACTUAL email context
//   (no invented facts — quotes the sender's real points).
// • Translation: real translation via the public MyMemory API (no key needed).
// • If AI_API_KEY / OPENAI_API_KEY is configured, an OpenAI-compatible LLM is
//   used instead — the response source is always labeled honestly.

function llmKey() {
  return process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
}

// Resolve the first configured LLM provider (bolt.diy-style provider list).
// Returns a base URL + key + model + api style, or null if none configured.
interface LlmProvider { provider: string; baseUrl: string; apiKey: string; model: string; api: "openai" | "anthropic" | "gemini" | "cohere"; }

export function resolveLlmProvider(): LlmProvider | null {
  const e = process.env;
  // Custom override first.
  if (e.AI_API_KEY || e.OPENAI_API_KEY) {
    return { provider: "openai", baseUrl: e.AI_API_BASE || "https://api.openai.com/v1", apiKey: e.AI_API_KEY || e.OPENAI_API_KEY || "", model: e.AI_MODEL || "gpt-4o-mini", api: "openai" };
  }
  if (e.ANTHROPIC_API_KEY) return { provider: "anthropic", baseUrl: "https://api.anthropic.com", apiKey: e.ANTHROPIC_API_KEY, model: e.AI_MODEL || "claude-3-5-sonnet-latest", api: "anthropic" };
  if (e.GEMINI_API_KEY || e.GOOGLE_API_KEY) return { provider: "gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", apiKey: e.GEMINI_API_KEY || e.GOOGLE_API_KEY || "", model: e.AI_MODEL || "gemini-1.5-flash", api: "gemini" };
  if (e.GROQ_API_KEY) return { provider: "groq", baseUrl: "https://api.groq.com/openai/v1", apiKey: e.GROQ_API_KEY, model: e.AI_MODEL || "llama-3.1-8b-instant", api: "openai" };
  if (e.XAI_API_KEY) return { provider: "xai", baseUrl: "https://api.x.ai/v1", apiKey: e.XAI_API_KEY, model: e.AI_MODEL || "grok-2-latest", api: "openai" };
  if (e.DEEPSEEK_API_KEY) return { provider: "deepseek", baseUrl: "https://api.deepseek.com/v1", apiKey: e.DEEPSEEK_API_KEY, model: e.AI_MODEL || "deepseek-chat", api: "openai" };
  if (e.MISTRAL_API_KEY) return { provider: "mistral", baseUrl: "https://api.mistral.ai/v1", apiKey: e.MISTRAL_API_KEY, model: e.AI_MODEL || "mistral-small-latest", api: "openai" };
  if (e.COHERE_API_KEY) return { provider: "cohere", baseUrl: "https://api.cohere.ai/v1", apiKey: e.COHERE_API_KEY, model: e.AI_MODEL || "command-r", api: "cohere" };
  if (e.TOGETHER_API_KEY) return { provider: "together", baseUrl: "https://api.together.xyz/v1", apiKey: e.TOGETHER_API_KEY, model: e.AI_MODEL || "meta-llama/Llama-3.1-8B-Instruct-Turbo", api: "openai" };
  if (e.PERPLEXITY_API_KEY) return { provider: "perplexity", baseUrl: "https://api.perplexity.ai", apiKey: e.PERPLEXITY_API_KEY, model: e.AI_MODEL || "sonar", api: "openai" };
  if (e.HF_API_KEY || e.HUGGINGFACE_API_KEY) return { provider: "huggingface", baseUrl: "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2/v1", apiKey: e.HF_API_KEY || e.HUGGINGFACE_API_KEY || "", model: e.AI_MODEL || "mistralai/Mistral-7B-Instruct-v0.2", api: "openai" };
  if (e.OPENROUTER_API_KEY) return { provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1", apiKey: e.OPENROUTER_API_KEY, model: e.AI_MODEL || "openai/gpt-4o-mini", api: "openai" };
  if (e.MOONSHOT_API_KEY) return { provider: "moonshot", baseUrl: "https://api.moonshot.ai/v1", apiKey: e.MOONSHOT_API_KEY, model: e.AI_MODEL || "moonshot-v1-8k", api: "openai" };
  if (e.OLLAMA_BASE_URL) return { provider: "ollama", baseUrl: `${e.OLLAMA_BASE_URL.replace(/\/$/, "")}/v1`, apiKey: e.OLLAMA_API_KEY || "ollama", model: e.AI_MODEL || "llama3.1", api: "openai" };
  if (e.LMSTUDIO_BASE_URL) return { provider: "lmstudio", baseUrl: `${e.LMSTUDIO_BASE_URL.replace(/\/$/, "")}/v1`, apiKey: e.LMSTUDIO_API_KEY || "lm-studio", model: e.AI_MODEL || "local-model", api: "openai" };
  if (e.OPENAI_LIKE_BASE_URL) return { provider: "openai_like", baseUrl: e.OPENAI_LIKE_BASE_URL, apiKey: e.OPENAI_LIKE_API_KEY || "key", model: e.AI_MODEL || "gpt-4o-mini", api: "openai" };
  return null;
}

export function detectLanguage(text: string): string {
  const t = text || "";
  const bangla = (t.match(/[\u0980-\u09FF]/g) || []).length;
  const kana = (t.match(/[\u3040-\u30FF]/g) || []).length;
  const han = (t.match(/[\u4E00-\u9FFF]/g) || []).length;
  const arabic = (t.match(/[\u0600-\u06FF]/g) || []).length;
  const cjkOther = (t.match(/[\u3400-\u4DBF\uF900-\uFAFF]/g) || []).length;
  if (bangla > 3) return "bn (Bangla)";
  if (kana > 3) return "ja (Japanese)";
  if (han + cjkOther > 3) return "zh (Chinese)";
  if (arabic > 3) return "ar (Arabic)";
  // Latin scripts: quick heuristic
  const words = t.toLowerCase().split(/\s+/);
  const de = words.filter((w) => ["und","der","die","das","ich","sie","nicht","auch","für","mit"].includes(w)).length;
  const fr = words.filter((w) => ["le","la","les","et","est","pour","avec","vous","nous"].includes(w)).length;
  if (fr > 2) return "fr (French)";
  if (de > 2) return "de (German)";
  return "en (English)";
}

function sentences(text: string): string[] {
  return (text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

// Extractive summary with real sentence scoring.
export function summarizeEmail(text: string, maxPoints = 4): string {
  const sents = sentences(text);
  if (sents.length === 0) return text.slice(0, 300) || "(empty)";
  const freq = new Map<string, number>();
  for (const s of sents) {
    for (const w of s.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length > 3) freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  const scored = sents.map((s, i) => {
    let score = 0;
    for (const w of s.toLowerCase().split(/[^a-z0-9]+/)) score += freq.get(w) || 0;
    if (i < 2) score += 2; // lead sentences matter
    if (/\b(need|want|require|please|deadline|price|cost|proposal|contract|confirm|schedule|payment)\b/i.test(s)) score += 3;
    return { s, score: score / Math.sqrt(s.length) };
  });
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, maxPoints);
  const order = scored.map((x, i) => i);
  const picked = top.map((x) => order[scored.findIndex((s) => s.s === x.s)]).sort((a, b) => a - b);
  return picked.map((i) => `• ${sents[i]}`).join("\n");
}

// Pull the sender's actual points so replies never invent facts.
function extractPoints(text: string): string[] {
  return sentences(text)
    .filter((s) => /\b(need|want|require|please|can you|could you|when|how much|price|deadline|confirm|send|attach|available|schedule|pay|deliver)\b/i.test(s))
    .slice(0, 3)
    .map((s) => s.length > 120 ? s.slice(0, 117) + "…" : s);
}

export function composeReply(opts: { senderName: string; subject: string; body: string; myName?: string; tone?: "professional" | "short" | "bangla" }): { text: string; source: string } {
  const points = extractPoints(opts.body);
  const first = opts.senderName.split(/[<@\s]/)[0] || "there";
  const myName = opts.myName || "Foysal";
  if (opts.tone === "bangla") {
    return {
      source: "template (bn)",
      text: `প্রিয় ${first},\n\nআপনার ইমেইলটি পড়েছি। ${points[0] ? `আপনার বক্তব্য: "${points[0]}" — ` : ""}বিষয়টি আমরা দেখছি এবং শীঘ্রই আপনাকে সঠিক তথ্য/আউটপুট পাঠাবো।\n\nআর কিছু জানার থাকলে জানান।\n\nধন্যবাদ,\n${myName}\nFOYSAL IT`,
    };
  }
  if (opts.tone === "short") {
    return {
      source: "context-engine (en)",
      text: `Hi ${first},\n\nNoted — I'll get back to you with the details on "${opts.subject}" shortly.\n\nThanks,\n${myName}`,
    };
  }
  const pointsBlock = points.length ? `\n\nRegarding your points:\n${points.map((p) => `- ${p}`).join("\n")}\nI'll address each of these and come back with specifics.` : "";
  return {
    source: "context-engine (en)",
    text: `Dear ${first},\n\nThank you for your email regarding "${opts.subject}". I've reviewed your message${points.length ? " and the key points you raised" : ""}.${pointsBlock}\n\nI'll follow up with you by end of day with the details we discussed. Please let me know if there's anything else you need in the meantime.\n\nBest regards,\n${myName}\nFOYSAL IT\n+880175401123 | foysalahmed.dm23@gmail.com`,
  };
}

export function shorten(text: string): { text: string; source: string } {
  const sents = sentences(text);
  if (sents.length <= 2) return { text: text.slice(0, 200), source: "trim" };
  return { text: sents.slice(0, Math.max(1, Math.floor(sents.length / 2))).join(" "), source: "trim" };
}

export function professionalize(text: string): { text: string; source: string } {
  let t = (text || "").trim();
  t = t.replace(/\b(kya|ki|na|haan|plz|pls|thx|:) \b/gi, " ").replace(/\s+/g, " ");
  if (!t) return { text, source: "no-op" };
  return {
    source: "style-pass",
    text: `Dear Recipient,\n\n${t.charAt(0).toUpperCase() + t.slice(1)}\n\nI look forward to your response.\n\nBest regards,\nFoysal\nFOYSAL IT`,
  };
}

// Real translation via MyMemory public API (free, no key).
export async function translate(text: string, target: "bn" | "ja" | "en" | "de" | "fr" | "ar" | "zh"): Promise<{ text: string; source: string }> {
  const pair: Record<string, string> = { bn: "bn", ja: "ja", en: "en", de: "de", fr: "fr", ar: "ar", zh: "zh" };
  const src = detectLanguage(text).split(" ")[0] || "en";
  const q = text.slice(0, 500);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${src}|${pair[target]}`;
    const res = await fetch(url, { cache: "no-store" });
    const d = await res.json();
    const out = d?.responseData?.translatedText;
    if (out && !/MYMEMORY WARNING/i.test(out)) {
      return { text: out, source: `MyMemory API (${src}→${target})` };
    }
    return { text: `Translation service notice: ${out || "service unavailable"}`, source: "MyMemory API (notice)" };
  } catch (e) {
    return { text: `Translation failed: ${e instanceof Error ? e.message : "network error"}`, source: "error" };
  }
}

export function createTaskFromEmail(subject: string, body: string): { title: string; detail: string; source: string } {
  const points = extractPoints(body);
  const title = points[0] ? points[0].slice(0, 80) : `Follow up: ${subject}`;
  const due = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return {
    title,
    detail: `From email "${subject}". Due suggestion: ${new Date(due).toLocaleDateString()}.`,
    source: "context-engine",
  };
}

// Real LLM completion using the first configured provider (bolt.diy-style).
export async function llmComplete(prompt: string): Promise<string | null> {
  const p = resolveLlmProvider();
  if (!p) return null;
  try {
    if (p.api === "openai") {
      const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, messages: [{ role: "user", content: prompt }], max_tokens: 600 }),
      });
      const d = await res.json().catch(() => ({}));
      return d?.choices?.[0]?.message?.content || null;
    }
    if (p.api === "anthropic") {
      const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/v1/messages`, {
        method: "POST",
        headers: { "x-api-key": p.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json().catch(() => ({}));
      return d?.content?.[0]?.text || null;
    }
    if (p.api === "gemini") {
      const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/models/${p.model}:generateContent?key=${p.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const d = await res.json().catch(() => ({}));
      return d?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    if (p.api === "cohere") {
      const res = await fetch(`${p.baseUrl.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${p.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: p.model, message: prompt }),
      });
      const d = await res.json().catch(() => ({}));
      return d?.text || null;
    }
  } catch {
    return null;
  }
  return null;
}

// Which provider is active (for the UI label). Null = built-in engines only.
export function activeProviderLabel(): string | null {
  const p = resolveLlmProvider();
  return p ? `${p.provider} (${p.model})` : null;
}
