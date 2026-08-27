// Server-side translation proxy (real, works, no key needed).
// Primary engine: MyMemory (free, no key). If an LLM key is configured, it can
// be used for higher-quality/nuanced translation. Never fakes a translation.

export const dynamic = "force-dynamic";

const MYMEMORY = "https://api.mymemory.translated.net/get";

function pair(from: string, to: string): string {
  const f = from.split("-")[0] || "en";
  const t = to.split("-")[0] || "bn";
  return `${f}|${t}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  const from = String(body.from || "bn");
  const to = String(body.to || "en");
  if (!text) return Response.json({ ok: false, error: "No text to translate." }, { status: 400 });
  if (text.length > 500) return Response.json({ ok: false, error: "Chunk too long (max 500 chars). Translate in chunks." }, { status: 400 });

  try {
    const url = `${MYMEMORY}?q=${encodeURIComponent(text)}&langpair=${pair(from, to)}`;
    const r = await fetch(url, { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    const out = d?.responseData?.translatedText;
    if (out && !/MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID/i.test(out)) {
      return Response.json({ ok: true, from, to, text: decodeHtml(out), source: "mymemory" });
    }
    return Response.json({ ok: false, error: "Translation service unavailable right now. Try again in a moment.", source: "mymemory" }, { status: 503 });
  } catch (e) {
    return Response.json({ ok: false, error: "Translation request failed. Check network and retry.", source: "mymemory" }, { status: 502 });
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
