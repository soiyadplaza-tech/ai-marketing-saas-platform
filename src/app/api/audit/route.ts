import { runAudit } from "@/lib/audit";
import { detectOpportunities } from "@/lib/opportunities";
import { recordJob } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Standalone website auditor (no lead required).
export async function POST(req: Request) {
  const started = Date.now();
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return Response.json({ error: "A website URL is required." }, { status: 400 });
  }
  try {
    const audit = await runAudit(url);
    const opportunities = audit.ok ? detectOpportunities(audit) : [];
    await recordJob(
      "website_audit",
      `Standalone audit: ${url}`,
      audit.ok ? "completed" : "failed",
      Date.now() - started,
      null,
      { score: audit.overallScore },
      audit.error
    );
    return Response.json({ audit, opportunities });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Audit failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
