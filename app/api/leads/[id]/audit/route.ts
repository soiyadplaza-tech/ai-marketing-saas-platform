import { auditAndScoreLead } from "@/lib/run-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const leadId = parseInt(id);
  try {
    const { audit, ok } = await auditAndScoreLead(leadId);
    return Response.json({ ok, audit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Audit failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
