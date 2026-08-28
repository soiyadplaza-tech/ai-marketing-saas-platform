import { db } from "@/db";
import { leads, organizations, users, campaigns, campaignSteps, automations } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { ORG_ID, logActivity } from "@/lib/repo";
import { hashPassword } from "@/lib/auth";
import { baselineScore } from "@/lib/scoring";
import { autoImportIfEmpty } from "@/lib/sheet-import";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

const DEMO_LEADS = [
  { company: "Dhaka Dental Care", contactName: "Dr. Rahim Uddin", email: "info@dhakadentalcare.com", phone: "+8801711000001", website: "https://example.com", industry: "Healthcare", location: "Dhaka, Bangladesh" },
  { company: "Green Leaf Restaurant", contactName: "Sadia Islam", email: "contact@greenleafbd.com", phone: "+8801711000002", website: "https://example.org", industry: "Food & Beverage", location: "Chittagong, Bangladesh" },
  { company: "TechNova Solutions", contactName: "Arif Hossain", email: "hello@technova.io", phone: "+8801711000003", website: "https://example.net", industry: "IT Services", location: "Dhaka, Bangladesh" },
  { company: "Urban Fitness Gym", contactName: "Nadia Karim", email: "join@urbanfitness.com", phone: "+8801711000004", website: "https://www.iana.org", industry: "Fitness", location: "Sylhet, Bangladesh" },
  { company: "Bloom Beauty Parlor", contactName: "Farzana Akter", email: "book@bloombeauty.com", phone: "+8801711000005", website: "https://example.com", industry: "Beauty", location: "Dhaka, Bangladesh" },
  { company: "SwiftLogistics BD", contactName: "Kamal Ahmed", email: "ops@swiftlogistics.com.bd", phone: "+8801711000006", website: "https://example.org", industry: "Logistics", location: "Narayanganj, Bangladesh" },
  { company: "EduBright Academy", contactName: "Tanvir Rahman", email: "admissions@edubright.edu.bd", phone: "+8801711000007", website: "https://example.net", industry: "Education", location: "Rajshahi, Bangladesh" },
  { company: "Coastal Travels", contactName: "Rumana Sultana", email: "tours@coastaltravels.com", phone: "+8801711000008", website: "https://www.iana.org", industry: "Travel", location: "Cox's Bazar, Bangladesh" },
];

export async function POST() {
  await ensureSchema();
  // ensure org + user
  const [existingOrg] = await db.select().from(organizations).where(eq(organizations.id, ORG_ID));
  if (!existingOrg) {
    await db.insert(organizations).values({ id: ORG_ID, name: "FOYSAL IT" });
  }
  // Stable user IDs (1-3) across DB resets so login sessions survive restarts.
  await db.insert(users).values([
    { id: 1, orgId: ORG_ID, name: "Foysal Ahmed", email: "admin@foysalit.com", role: "super_admin", passwordHash: hashPassword("foysal@2026") },
    { id: 2, orgId: ORG_ID, name: "Foysal Ahmed", email: "foysalahmed.dm23@gmail.com", role: "super_admin", passwordHash: hashPassword("foysal@2026") },
    { id: 3, orgId: ORG_ID, name: "Sales Rep", email: "sales@foysalit.com", role: "sales" },
  ]).onConflictDoNothing();

  // Demo/sample leads are intentionally NOT seeded — the platform is populated
  // exclusively from the connected Google Sheet import. If the leads table is
  // empty and a master sheet URL is configured, auto-import it now so data
  // persists across environment resets.
  void DEMO_LEADS;
  void baselineScore;
  // Fire-and-forget so the first page load isn't blocked by a large import.
  void autoImportIfEmpty();

  const campCount = await db.select({ c: count() }).from(campaigns).where(eq(campaigns.orgId, ORG_ID));
  if (Number(campCount[0]?.c ?? 0) === 0) {
    const [c] = await db.insert(campaigns).values({
      orgId: ORG_ID, name: "SEO Opportunity Outreach", channel: "email", status: "draft", dailyLimit: 400, leadCount: 0,
    }).returning();
    await db.insert(campaignSteps).values([
      { campaignId: c.id, dayOffset: 1, channel: "email", subject: "Quick idea for {{company}}", body: "Personalized intro", orderIndex: 0 },
      { campaignId: c.id, dayOffset: 3, channel: "email", subject: "Following up", body: "Follow up", orderIndex: 1 },
      { campaignId: c.id, dayOffset: 6, channel: "email", subject: "A value idea", body: "Value based", orderIndex: 2 },
      { campaignId: c.id, dayOffset: 10, channel: "email", subject: "One more insight", body: "Insight", orderIndex: 3 },
      { campaignId: c.id, dayOffset: 15, channel: "email", subject: "Final note", body: "Final", orderIndex: 4 },
    ]);
  }

  const autoCount = await db.select({ c: count() }).from(automations).where(eq(automations.orgId, ORG_ID));
  if (Number(autoCount[0]?.c ?? 0) === 0) {
    await db.insert(automations).values({
      orgId: ORG_ID,
      name: "New Lead → Audit → Score → Draft Outreach",
      trigger: "lead_created",
      enabled: false,
      steps: [
        { type: "trigger", label: "New Lead Created" },
        { type: "action", label: "Enrich & Find Website" },
        { type: "action", label: "Run Website Audit" },
        { type: "action", label: "AI Lead Scoring" },
        { type: "action", label: "Detect Opportunities & Match Service" },
        { type: "action", label: "Generate Personalized Draft" },
        { type: "approval", label: "Wait for Human Approval" },
        { type: "action", label: "Send via Provider" },
        { type: "wait", label: "Wait 3 days" },
        { type: "condition", label: "Reply received?" },
        { type: "action", label: "Send Follow-up / Update Pipeline" },
      ],
    });
  }

  return Response.json({ ok: true });
}
