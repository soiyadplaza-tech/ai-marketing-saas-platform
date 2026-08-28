import { db } from "@/db";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";
import { pingArena, getArenas, getModels, importArenaLeads } from "@/lib/arena";

export const dynamic = "force-dynamic";

export async function GET() {
  const [integration] = await db.select().from(integrations).where(eq(integrations.orgId, ORG_ID)).limit(1);
  const ping = await pingArena();
  const arenas = ping.ok ? await getArenas() : [];
  const models = ping.ok ? await getModels() : [];
  return Response.json({
    provider: 'arena',
    configured: !!process.env.ARENA_API_KEY,
    status: ping.ok ? 'connected' : 'disconnected',
    ping,
    arenas,
    models: Array.isArray(models) ? models.slice(0, 50) : [],
    integration: integration || null,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'test';

  if (action === 'test') {
    const ping = await pingArena();
    if (ping.ok) {
      await db.insert(integrations).values({
        orgId: ORG_ID,
        provider: 'arena',
        status: 'connected',
        config: { lastTest: new Date().toISOString() },
        lastTestedAt: new Date(),
      }).onConflictDoUpdate({ target: [integrations.orgId, integrations.provider], set: { status: 'connected', lastTestedAt: new Date() } });
    }
    return Response.json(ping);
  }

  if (action === 'import') {
    const result = await importArenaLeads({ arena: body.arena, category: body.category, limit: body.limit });
    if (result.ok) {
      await db.insert(integrations).values({
        orgId: ORG_ID,
        provider: 'arena',
        status: 'connected',
        config: { lastImport: new Date().toISOString(), imported: result.inserted },
        lastTestedAt: new Date(),
      }).onConflictDoUpdate({ target: [integrations.orgId, integrations.provider], set: { status: 'connected', config: { lastImport: new Date().toISOString(), imported: result.inserted } } });
    }
    return Response.json(result);
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
