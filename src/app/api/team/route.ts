import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(users).where(eq(users.orgId, ORG_ID));
  return Response.json({ users: rows });
}
