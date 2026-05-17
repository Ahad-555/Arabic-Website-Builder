import { Router } from "express";
import { db, studentsTable, projectsTable, certificatesTable, skillsTable, studentSkillsTable, activityTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";
import {
  GetDashboardStatsResponse,
  GetTopSkillsResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [studentCount] = await db.select({ count: count() }).from(studentsTable);
  const [projectCount] = await db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.trustStamp, true));
  const [avgReadiness] = await db.select({ avg: avg(studentsTable.overallScore) }).from(studentsTable);
  const [certCount] = await db.select({ count: count() }).from(certificatesTable);
  const [skillCount] = await db.select({ count: count() }).from(skillsTable);

  const students = await db.select({ readinessLevel: studentsTable.readinessLevel }).from(studentsTable);
  const readyStudents = students.filter(s => s.readinessLevel === "ready" || s.readinessLevel === "advanced").length;

  res.json(GetDashboardStatsResponse.parse({
    totalStudents: studentCount?.count ?? 0,
    verifiedProjects: projectCount?.count ?? 0,
    averageReadiness: Number(avgReadiness?.avg ?? 0),
    certificatesIssued: certCount?.count ?? 0,
    topSector: "شركات التقنية الكبرى",
    studentsReadyForWork: readyStudents,
    skillsTracked: skillCount?.count ?? 0,
  }));
});

router.get("/dashboard/top-skills", async (_req, res): Promise<void> => {
  const skills = await db.select().from(skillsTable);
  const studentSkills = await db.select({ skillId: studentSkillsTable.skillId }).from(studentSkillsTable);

  const skillCounts: Record<number, number> = {};
  for (const ss of studentSkills) {
    skillCounts[ss.skillId] = (skillCounts[ss.skillId] ?? 0) + 1;
  }

  const topSkills = skills.map(s => ({
    name: s.name,
    demandLevel: s.demandLevel,
    studentsCount: skillCounts[s.id] ?? 0,
    marketDemand: s.marketWeight * 100,
  })).sort((a, b) => b.marketDemand - a.marketDemand).slice(0, 8);

  res.json(GetTopSkillsResponse.parse(topSkills));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(activityTable.createdAt)
    .limit(15);

  // Return in reverse order (newest first)
  const sorted = [...activities].reverse();

  res.json(GetRecentActivityResponse.parse(sorted.map(a => ({
    id: a.id,
    type: a.type,
    message: a.message,
    studentName: a.studentName,
    createdAt: a.createdAt.toISOString(),
  }))));
});

export default router;
