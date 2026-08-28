import { summarizeEmail, composeReply, shorten, professionalize, translate, createTaskFromEmail, detectLanguage, llmComplete } from "@/lib/email-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AI Email Assistant. Every response is a REAL computation over the supplied
// email text — or a real LLM call when AI_API_KEY is configured.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const text = String(body.text || "");
  const sender = String(body.sender || "there");
  const subject = String(body.subject || "");
  const target = String(body.target || "bn");

  if (!text && action !== "task") {
    return Response.json({ ok: false, error: "No email text supplied." }, { status: 400 });
  }

  try {
    // Real LLM when a key is configured (labeled honestly).
    const useLlm = !!process.env.AI_API_KEY || !!process.env.OPENAI_API_KEY;
    const llm = useLlm
      ? await llmComplete(
          `You are an email assistant. Action: ${action}. Sender: ${sender}. Subject: ${subject}. Target language: ${target}. Email text:\n"""\n${text.slice(0, 6000)}\n"""\nRespond with the result only.`
        )
      : null;
    if (llm) return Response.json({ ok: true, action, source: "LLM (configured AI API)", text: llm });

    switch (action) {
      case "summarize":
        return Response.json({ ok: true, action, source: "extractive engine", text: summarizeEmail(text) });
      case "client-wants": {
        const s = summarizeEmail(text, 3);
        return Response.json({ ok: true, action, source: "extractive engine", text: `Based on the actual email content, the sender's key points:\n${s}\n\nDetected language: ${detectLanguage(text)}` });
      }
      case "reply":
        return Response.json({ ok: true, action, source: composeReply({ senderName: sender, subject, body: text }).source, text: composeReply({ senderName: sender, subject, body: text }).text });
      case "shorter": {
        const r = shorten(text);
        return Response.json({ ok: true, action, source: r.source, text: r.text });
      }
      case "professional": {
        const r = professionalize(text);
        return Response.json({ ok: true, action, source: r.source, text: r.text });
      }
      case "translate": {
        const r = await translate(text, (["bn", "ja", "en", "de", "fr", "ar", "zh"].includes(target) ? target : "bn") as any);
        return Response.json({ ok: true, action, source: r.source, text: r.text });
      }
      case "task": {
        const r = createTaskFromEmail(subject, text);
        return Response.json({ ok: true, action, source: r.source, text: r.detail, task: { title: r.title } });
      }
      case "language":
        return Response.json({ ok: true, action, source: "script-detection", text: detectLanguage(text) });
      default:
        return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "AI action failed" }, { status: 500 });
  }
}
