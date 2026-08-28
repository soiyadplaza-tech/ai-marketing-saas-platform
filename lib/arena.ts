const BASE_URL = 'https://www.designarena.ai/api/v1';

export function arenaConfigured() {
  return !!process.env.ARENA_API_KEY;
}

export async function pingArena() {
  const key = process.env.ARENA_API_KEY;
  if (!key) return { ok: false, error: 'ARENA_API_KEY not configured' };
  try {
    const r = await fetch(`${BASE_URL}/arenas`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const data = await r.json();
    return { ok: true, name: 'Design Arena', arenas: Array.isArray(data) ? data.length : 0 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' };
  }
}

export async function getArenas() {
  const key = process.env.ARENA_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`${BASE_URL}/arenas`, { headers: { 'Authorization': `Bearer ${key}` } });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

export async function getModels() {
  const key = process.env.ARENA_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`${BASE_URL}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

export async function getLeaderboard(arena: string, category: string) {
  const key = process.env.ARENA_API_KEY;
  if (!key) return [];
  try {
    const r = await fetch(`${BASE_URL}/leaderboard/${encodeURIComponent(arena)}/${encodeURIComponent(category)}`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

export async function importArenaLeads(options?: { arena?: string; category?: string; limit?: number }) {
  const key = process.env.ARENA_API_KEY;
  if (!key) return { ok: false, error: 'ARENA_API_KEY not configured', inserted: 0 };
  
  const arena = options?.arena || 'models';
  const category = options?.category || 'website';
  const limit = Math.min(options?.limit || 100, 500);

  try {
    const r = await fetch(`${BASE_URL}/leaderboard/${encodeURIComponent(arena)}/${encodeURIComponent(category)}`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}`, inserted: 0 };
    const data = await r.json();
    const models = Array.isArray(data) ? data.slice(0, limit) : [];

    const { db } = await import('@/db');
    const { leads } = await import('@/db/schema');
    const { ORG_ID } = await import('@/lib/repo');
    const { eq } = await import('drizzle-orm');

    let inserted = 0, dupCount = 0;
    for (const m of models) {
      const name = m?.name || m?.modelId || m?.id;
      if (!name) continue;
      const email = `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ai` || null;
      const website = m?.websiteUrl || m?.url || `https://${name.toLowerCase().replace(/\s+/g, '')}.ai` || null;
      
      const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.orgId, ORG_ID)).limit(1);
      void existing;

      await db.insert(leads).values({
        orgId: ORG_ID,
        company: name,
        contactName: m?.organization || m?.developer || 'Arena AI Team',
        email: email || undefined,
        website: website || undefined,
        industry: 'AI/ML',
        location: 'Global',
        source: 'arena_ai',
        enrichment: { arenaModel: 'true', arena, category, rank: String(m?.rank ?? ''), elo: String(m?.elo ?? ''), license: m?.license || '' },
        leadScore: m?.elo ? Math.min(100, Math.round(m.elo / 30)) : 50,
        scoreCategory: m?.elo && m.elo > 1200 ? 'priority' : m?.elo && m.elo > 1000 ? 'hot' : 'warm',
      });
      inserted++;
    }

    return { ok: true, inserted, dupCount };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Import failed', inserted: 0 };
  }
}
