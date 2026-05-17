import { Router } from "express";
import { eq, and } from "drizzle-orm";
import {
  db, skillsTable, studentSkillsTable, studentsTable, activityTable,
  skillQuestionsTable, quizAttemptsTable,
} from "@workspace/db";
import {
  ListSkillsResponse,
  GetStudentSkillsParams,
  GetStudentSkillsResponse,
  GetSkillGapParams,
  GetSkillGapResponse,
  GetInvestmentValueParams,
  GetInvestmentValueResponse,
  GetCareerPathsParams,
  GetCareerPathsResponse,
} from "@workspace/api-zod";

const router = Router();

const MARKET_REQUIREMENTS: Record<string, number> = {
  programming: 4.5,
  design: 3.5,
  data: 4.8,
  management: 3.0,
  communication: 3.2,
  other: 2.5,
};

const CAREER_SECTORS = [
  { sector: "NEOM", categories: ["programming", "data", "design"], demandLevel: "critical" as const, salaryRange: "15,000 - 25,000 ريال" },
  { sector: "البنوك والتمويل", categories: ["programming", "data", "management"], demandLevel: "high" as const, salaryRange: "10,000 - 18,000 ريال" },
  { sector: "شركات التقنية الكبرى", categories: ["programming", "design", "data"], demandLevel: "critical" as const, salaryRange: "12,000 - 22,000 ريال" },
  { sector: "مصرف الإنماء", categories: ["programming", "data", "management"], demandLevel: "high" as const, salaryRange: "9,000 - 16,000 ريال" },
  { sector: "وزارة الاتصالات", categories: ["programming", "data", "management"], demandLevel: "high" as const, salaryRange: "8,000 - 14,000 ريال" },
  { sector: "الرعاية الصحية الذكية", categories: ["programming", "data", "other"], demandLevel: "medium" as const, salaryRange: "7,000 - 12,000 ريال" },
  { sector: "التعليم الإلكتروني", categories: ["design", "programming", "communication"], demandLevel: "medium" as const, salaryRange: "6,000 - 10,000 ريال" },
];

router.get("/skills", async (_req, res): Promise<void> => {
  const skills = await db.select().from(skillsTable);
  res.json(skills);
});

router.post("/skills", async (req, res): Promise<void> => {
  const { name, nameEn, category, description } = req.body;
  if (!name || !category) {
    res.status(400).json({ error: "name and category are required" });
    return;
  }
  const [skill] = await db.insert(skillsTable).values({
    name,
    nameEn: nameEn || null,
    category,
    description: description || null,
  }).returning();
  res.status(201).json(skill);
});

router.delete("/skills/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(skillsTable).where(eq(skillsTable.id, id));
  res.json({ success: true });
});

router.get("/skills/:id/questions", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const questions = await db.select().from(skillQuestionsTable).where(eq(skillQuestionsTable.skillId, id));
  res.json(questions);
});

router.post("/skills/:id/questions", async (req, res): Promise<void> => {
  const skillId = parseInt(req.params.id);
  if (isNaN(skillId)) { res.status(400).json({ error: "Invalid skill id" }); return; }
  const { questionText, optionA, optionB, optionC, optionD, correctOption } = req.body;
  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  const [question] = await db.insert(skillQuestionsTable).values({
    skillId, questionText, optionA, optionB, optionC, optionD, correctOption,
  }).returning();
  res.status(201).json(question);
});

router.delete("/questions/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(skillQuestionsTable).where(eq(skillQuestionsTable.id, id));
  res.json({ success: true });
});

router.get("/students/:id/skills", async (req, res): Promise<void> => {
  const params = GetStudentSkillsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const rows = await db
    .select({
      id: studentSkillsTable.id,
      studentId: studentSkillsTable.studentId,
      skillId: studentSkillsTable.skillId,
      skillName: skillsTable.name,
      skillNameEn: skillsTable.nameEn,
      category: skillsTable.category,
      level: studentSkillsTable.level,
      verified: studentSkillsTable.verified,
      score: studentSkillsTable.score,
      verifiedAt: studentSkillsTable.verifiedAt,
    })
    .from(studentSkillsTable)
    .leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id))
    .where(eq(studentSkillsTable.studentId, params.data.id));

  res.json(rows.map(r => ({ ...r, verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null })));
});

router.post("/students/:id/skills/verify", async (req, res): Promise<void> => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) { res.status(400).json({ error: "Invalid student id" }); return; }
  const { skillId, score } = req.body;
  if (!skillId || score === undefined) {
    res.status(400).json({ error: "skillId and score are required" });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, skillId));
  if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }

  const [existing] = await db.select().from(studentSkillsTable)
    .where(and(eq(studentSkillsTable.studentId, studentId), eq(studentSkillsTable.skillId, skillId)));

  const passed = score >= 60;
  let result;
  if (existing) {
    [result] = await db.update(studentSkillsTable)
      .set({ score, verified: passed, verifiedAt: passed ? new Date() : null })
      .where(eq(studentSkillsTable.id, existing.id))
      .returning();
  } else {
    [result] = await db.insert(studentSkillsTable).values({
      studentId, skillId, level: 3, score, verified: passed,
      verifiedAt: passed ? new Date() : null,
    }).returning();
  }

  const allSkills = await db.select().from(studentSkillsTable).where(eq(studentSkillsTable.studentId, studentId));
  const avgScore = allSkills.reduce((sum, s) => sum + s.score, 0) / (allSkills.length || 1);
  const readiness = avgScore >= 80 ? "advanced" : avgScore >= 60 ? "ready" : avgScore >= 40 ? "developing" : "beginner";
  await db.update(studentsTable).set({ overallScore: avgScore, readinessLevel: readiness }).where(eq(studentsTable.id, studentId));

  res.json({ ...result, verifiedAt: result.verifiedAt ? result.verifiedAt.toISOString() : null });
});

router.delete("/students/:id/skills/:skillId", async (req, res): Promise<void> => {
  const studentId = parseInt(req.params.id);
  const skillId = parseInt(req.params.skillId);
  if (isNaN(studentId) || isNaN(skillId)) { res.status(400).json({ error: "Invalid ids" }); return; }
  await db.delete(studentSkillsTable)
    .where(and(eq(studentSkillsTable.studentId, studentId), eq(studentSkillsTable.skillId, skillId)));
  res.json({ success: true });
});

router.get("/students/:id/quiz-history", async (req, res): Promise<void> => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) { res.status(400).json({ error: "Invalid id" }); return; }
  const attempts = await db
    .select({
      id: quizAttemptsTable.id,
      studentId: quizAttemptsTable.studentId,
      skillId: quizAttemptsTable.skillId,
      skillName: skillsTable.name,
      skillNameEn: skillsTable.nameEn,
      score: quizAttemptsTable.score,
      passed: quizAttemptsTable.passed,
      takenAt: quizAttemptsTable.takenAt,
    })
    .from(quizAttemptsTable)
    .leftJoin(skillsTable, eq(quizAttemptsTable.skillId, skillsTable.id))
    .where(eq(quizAttemptsTable.studentId, studentId))
    .orderBy(quizAttemptsTable.takenAt);
  res.json(attempts.map(a => ({ ...a, takenAt: a.takenAt.toISOString() })));
});

router.post("/students/:id/skills", async (req, res): Promise<void> => {
  const studentId = parseInt(req.params.id);
  if (isNaN(studentId)) { res.status(400).json({ error: "Invalid student id" }); return; }
  const { skillId, level } = req.body;
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, skillId));
  if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }
  const [existing] = await db.select().from(studentSkillsTable)
    .where(and(eq(studentSkillsTable.studentId, studentId), eq(studentSkillsTable.skillId, skillId)));
  let result;
  if (existing) {
    [result] = await db.update(studentSkillsTable)
      .set({ level: level || 1, score: (level || 1) * 20 })
      .where(eq(studentSkillsTable.id, existing.id)).returning();
  } else {
    [result] = await db.insert(studentSkillsTable)
      .values({ studentId, skillId, level: level || 1, score: (level || 1) * 20 }).returning();
  }
  res.status(201).json({ ...result, skillName: skill.name, category: skill.category, verifiedAt: result.verifiedAt ? result.verifiedAt.toISOString() : null });
});

router.get("/students/:id/skill-gap", async (req, res): Promise<void> => {
  const params = GetSkillGapParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const rows = await db.select({ skillName: skillsTable.name, category: skillsTable.category, level: studentSkillsTable.level, demandLevel: skillsTable.demandLevel })
    .from(studentSkillsTable).leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id)).where(eq(studentSkillsTable.studentId, params.data.id));
  const allSkills = await db.select().from(skillsTable);
  const gaps = [];
  const strengths: string[] = [];
  for (const row of rows) {
    const required = MARKET_REQUIREMENTS[row.category ?? "other"] ?? 3.0;
    const current = row.level ?? 0;
    const gap = Math.max(0, required - current);
    if (gap > 0) {
      gaps.push({ skillName: row.skillName ?? "", currentLevel: current, requiredLevel: required, gap, priority: gap >= 3 ? "critical" : gap >= 2 ? "high" : gap >= 1 ? "medium" : "low", recommendation: `تحتاج إلى تطوير مهارة ${row.skillName}` });
    } else { strengths.push(row.skillName ?? ""); }
  }
  const coveredCategories = new Set(rows.map(r => r.category));
  for (const skill of allSkills.slice(0, 5)) {
    if (!coveredCategories.has(skill.category)) {
      gaps.push({ skillName: skill.name, currentLevel: 0, requiredLevel: MARKET_REQUIREMENTS[skill.category] ?? 3.0, gap: MARKET_REQUIREMENTS[skill.category] ?? 3.0, priority: "high" as const, recommendation: `يُنصح بتعلم ${skill.name}` });
    }
  }
  const overallReadiness = rows.length === 0 ? 0 : Math.min(100, (rows.reduce((sum, r) => sum + ((r.level ?? 0) / (MARKET_REQUIREMENTS[r.category ?? "other"] ?? 3)), 0) / rows.length) * 100);
  res.json(GetSkillGapResponse.parse({ studentId: params.data.id, overallReadiness, gaps: gaps.slice(0, 8), strengths }));
});

router.get("/students/:id/investment-value", async (req, res): Promise<void> => {
  const params = GetInvestmentValueParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }
  const skills = await db.select({ level: studentSkillsTable.level, demandLevel: skillsTable.demandLevel, marketWeight: skillsTable.marketWeight }).from(studentSkillsTable).leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id)).where(eq(studentSkillsTable.studentId, params.data.id));
  const baseRate = 30;
  const demandMultiplier = skills.reduce((sum, s) => { const dm = s.demandLevel === "critical" ? 2.0 : s.demandLevel === "high" ? 1.5 : s.demandLevel === "medium" ? 1.2 : 1.0; return sum + dm * (s.marketWeight ?? 1.0) * (s.level ?? 1); }, 0) / (skills.length || 1);
  const rarityScore = Math.min(100, skills.filter(s => s.demandLevel === "critical" || s.demandLevel === "high").length * 15);
  const demandScore = Math.min(100, demandMultiplier * 20);
  const estimate = Math.round(baseRate * demandMultiplier);
  res.json(GetInvestmentValueResponse.parse({ studentId: params.data.id, hourlyRateMin: Math.round(estimate * 0.8), hourlyRateMax: Math.round(estimate * 1.4), hourlyRateEstimate: estimate, currency: "ريال سعودي", rarityScore, demandScore, marketInsight: rarityScore > 60 ? "مهاراتك نادرة وعالية الطلب في السوق السعودي" : "مهاراتك في تطور ومطلوبة — استمري في تطوير نفسك" }));
});

router.get("/students/:id/career-paths", async (req, res): Promise<void> => {
  const params = GetCareerPathsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const skills = await db.select({ category: skillsTable.category, level: studentSkillsTable.level }).from(studentSkillsTable).leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id)).where(eq(studentSkillsTable.studentId, params.data.id));
  const studentCategories = skills.reduce((acc: Record<string, number>, s) => { const cat = s.category ?? "other"; acc[cat] = Math.max(acc[cat] ?? 0, s.level ?? 0); return acc; }, {});
  const paths = CAREER_SECTORS.map(sector => {
    const matchedCategories = sector.categories.filter(c => studentCategories[c] !== undefined);
    const matchScore = Math.round((matchedCategories.reduce((sum, c) => sum + (studentCategories[c] ?? 0) / 5, 0) / sector.categories.length) * 100);
    const rolesByCategory: Record<string, string[]> = { programming: ["مطورة تطبيقات", "مهندسة برمجيات"], design: ["مصممة تجربة مستخدم"], data: ["محللة بيانات", "باحثة ذكاء اصطناعي"], management: ["مديرة مشاريع تقنية"], communication: ["متخصصة تواصل رقمي"] };
    const roles = sector.categories.flatMap(c => (rolesByCategory[c] ?? []).slice(0, 1));
    return { sector: sector.sector, matchScore, roles, demandLevel: sector.demandLevel, salaryRange: sector.salaryRange, description: `قطاع ${sector.sector} يبحث عن كفاءات في ${sector.categories.join(" و")}` };
  });
  paths.sort((a, b) => b.matchScore - a.matchScore);
  res.json(GetCareerPathsResponse.parse(paths));
});

export default router;
