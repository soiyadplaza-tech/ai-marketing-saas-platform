import { db } from "@/db";
import { files, aiJobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ORG_ID } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const [fileRows, jobRows] = await Promise.all([
    db.select().from(files).where(eq(files.orgId, ORG_ID)).orderBy(desc(files.createdAt)).limit(100),
    db.select().from(aiJobs).where(eq(aiJobs.orgId, ORG_ID)).orderBy(desc(aiJobs.createdAt)).limit(100),
  ]);
  return Response.json({ files: fileRows, jobs: jobRows });
}
