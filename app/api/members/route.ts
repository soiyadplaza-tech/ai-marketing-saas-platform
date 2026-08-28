import { db } from "@/db";
import { users, organizations, leads } from "@/db/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import { isPlatformAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Platform-admin only: list ALL members across all workspaces, each with their
// lead count, so the owner can see and track everyone's data.
export async function GET() {
  if (!(await isPlatformAdmin())) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const users_ = await db.select().from(users).orderBy(desc(users.createdAt)).limit(500);
  const orgs = await db.select().from(organizations);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));

  // Lead count per org (one query).
  const orgIds = Array.from(new Set(users_.map((u) => u.orgId)));
  const leadCounts = orgIds.length
    ? await db
        .select({ orgId: leads.orgId, c: count() })
        .from(leads)
        .where(inArray(leads.orgId, orgIds))
        .groupBy(leads.orgId)
    : [];
  const leadCountMap = new Map(leadCounts.map((r) => [r.orgId, Number(r.c)]));

  return Response.json({
    ok: true,
    totalMembers: users_.length,
    members: users_.map((u) => ({
      id: u.id,
      orgId: u.orgId,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      workspace: orgName.get(u.orgId) || "—",
      leadCount: leadCountMap.get(u.orgId) || 0,
      joined: u.createdAt,
      isOwner: u.email === "foysalimran890098@gmail.com" || u.role === "super_admin",
    })),
  });
}
