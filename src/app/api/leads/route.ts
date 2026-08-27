import { db } from "@/db";
import { leads } from "@/db/schema";
import { and, desc, asc, eq, ilike, or, sql, gte, lte, count, isNotNull, isNull } from "drizzle-orm";
import { ORG_ID, logActivity, notify } from "@/lib/repo";
import { currentDataScope } from "@/lib/auth";
import { baselineScore } from "@/lib/scoring";
import { normalizeLead, isValidEmail } from "@/lib/parse";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;
  const page = Math.max(1, parseInt(p.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(p.get("pageSize") || "20")));
  const search = p.get("search")?.trim();
  const category = p.get("category");
  const stage = p.get("stage");
  const service = p.get("service");
  const sort = p.get("sort") || "score";
  const scope = await currentDataScope();
  if (!scope.authenticated) return Response.json({ error: "Login required." }, { status: 401 });
  const viewOrg = p.get("org") ? parseInt(p.get("org")!) : null;
  const conds: any[] = [];
  if (scope.owner && viewOrg) conds.push(eq(leads.orgId, viewOrg)); // owner viewing a member's workspace
  else if (scope.owner) conds.push(eq(leads.orgId, ORG_ID)); // owner's main workspace (default)
  else conds.push(eq(leads.orgId, scope.orgId)); // member sees only their own org
  if (search) {
    conds.push(
      or(
        ilike(leads.company, `%${search}%`),
        ilike(leads.email, `%${search}%`),
        ilike(leads.contactName, `%${search}%`),
        ilike(leads.website, `%${search}%`),
        ilike(leads.industry, `%${search}%`)
      )!
    );
  }
  if (category) conds.push(eq(leads.scoreCategory, category));
  if (stage) conds.push(eq(leads.stage, stage));
  if (service) conds.push(sql`${leads.recommendedServices} @> ${JSON.stringify([service])}::jsonb`);
  const hasWebsite = p.get("hasWebsite");
  if (hasWebsite === "yes") conds.push(isNotNull(leads.website));
  if (hasWebsite === "no") conds.push(sql`${leads.website} IS NULL`);

  const minScore = p.get("minScore");
  const maxScore = p.get("maxScore");
  if (minScore) conds.push(gte(leads.leadScore, parseInt(minScore)));
  if (maxScore) conds.push(lte(leads.leadScore, parseInt(maxScore)));

  const where = and(...conds);

  let orderBy;
  if (sort === "recent") orderBy = desc(leads.createdAt);
  else if (sort === "company") orderBy = asc(leads.company);
  else orderBy = desc(leads.leadScore);

  const [rows, totalRes] = await Promise.all([
    db.select().from(leads).where(where).orderBy(orderBy).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ c: count() }).from(leads).where(where),
  ]);

  const total = totalRes[0]?.c ?? 0;
  return Response.json({ leads: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) });
}

export async function POST(req: Request) {
  const body = await req.json();
  const lead = normalizeLead({
    company: (body.company || "").trim(),
    contactName: body.contactName,
    email: body.email,
    phone: body.phone,
    website: body.website,
    industry: body.industry,
    location: body.location,
    notes: body.notes,
  });

  if (!lead.company) {
    return Response.json({ error: "Company name is required." }, { status: 400 });
  }
  if (!isValidEmail(lead.email)) {
    return Response.json({ error: "Invalid email address." }, { status: 400 });
  }

  const scope = await currentDataScope();
  const orgId = scope.orgId; // members create in their own org; owner in main org

  // Duplicate detection (email OR company+website) within the user's scope
  const dupConds: any[] = [];
  if (!scope.owner) dupConds.push(eq(leads.orgId, orgId));
  const dupChecks = [];
  if (lead.email) dupChecks.push(eq(leads.email, lead.email));
  if (lead.website) dupChecks.push(eq(leads.website, lead.website));
  if (dupChecks.length) {
    const existing = await db
      .select()
      .from(leads)
      .where(and(...dupConds, or(...dupChecks)))
      .limit(1);
    if (existing.length) {
      return Response.json({ error: "Duplicate lead detected.", duplicate: existing[0] }, { status: 409 });
    }
  }

  const sc = baselineScore(lead);
  const [created] = await db
    .insert(leads)
    .values({
      orgId,
      company: lead.company,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      whatsapp: body.whatsapp || lead.phone,
      website: lead.website,
      industry: lead.industry,
      location: lead.location,
      source: body.source || "manual",
      leadScore: sc.score,
      scoreCategory: sc.category,
      scoreReasons: sc.reasons,
      status: "new_lead",
      stage: "new_lead",
    })
    .returning();

  await logActivity("created", `Lead created: ${created.company}`, created.id);
  if (created.scoreCategory === "priority") {
    await notify("priority_lead", "New priority lead", `${created.company} scored ${created.leadScore}/100`, created.id);
  }

  return Response.json({ lead: created }, { status: 201 });
}
