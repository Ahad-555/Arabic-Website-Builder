import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, skillsTable, studentSkillsTable, studentsTable, activityTable } from "@workspace/db";
import {
  ListSkillsResponse,
  GetStudentSkillsParams,
  GetStudentSkillsResponse,
  AddStudentSkillParams,
  AddStudentSkillBody,
  GetSkillGapParams,
  GetSkillGapResponse,
  GetInvestmentValueParams,
  GetInvestmentValueResponse,
  GetCareerPathsParams,
  GetCareerPathsResponse,
} from "@workspace/api-zod";

const router = Router();

// Market demand data per skill category
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
  res.json(ListSkillsResponse.parse(skills));
});

router.get("/students/:id/skills", async (req, res): Promise<void> => {
  const params = GetStudentSkillsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({
      id: studentSkillsTable.id,
      studentId: studentSkillsTable.studentId,
      skillId: studentSkillsTable.skillId,
      skillName: skillsTable.name,
      category: skillsTable.category,
      level: studentSkillsTable.level,
      verified: studentSkillsTable.verified,
      score: studentSkillsTable.score,
      verifiedAt: studentSkillsTable.verifiedAt,
    })
    .from(studentSkillsTable)
    .leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id))
    .where(eq(studentSkillsTable.studentId, params.data.id));

  res.json(GetStudentSkillsResponse.parse(rows.map(r => ({
    ...r,
    verifiedAt: r.verifiedAt ? r.verifiedAt.toISOString() : null,
  }))));
});

router.post("/students/:id/skills", async (req, res): Promise<void> => {
  const params = AddStudentSkillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddStudentSkillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, parsed.data.skillId));
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  // Check if already exists
  const [existing] = await db.select().from(studentSkillsTable)
    .where(and(eq(studentSkillsTable.studentId, params.data.id), eq(studentSkillsTable.skillId, parsed.data.skillId)));

  let result;
  if (existing) {
    [result] = await db.update(studentSkillsTable)
      .set({ level: parsed.data.level, score: parsed.data.level * 20 })
      .where(eq(studentSkillsTable.id, existing.id))
      .returning();
  } else {
    [result] = await db.insert(studentSkillsTable)
      .values({ studentId: params.data.id, skillId: parsed.data.skillId, level: parsed.data.level, score: parsed.data.level * 20 })
      .returning();

    await db.insert(activityTable).values({
      type: "skill_added",
      message: `أضافت مهارة ${skill.name} بمستوى ${parsed.data.level}`,
      studentName: student.name,
      studentId: params.data.id,
    });
  }

  // Update student overall score
  const allSkills = await db.select().from(studentSkillsTable).where(eq(studentSkillsTable.studentId, params.data.id));
  const avgScore = allSkills.reduce((sum, s) => sum + s.score, 0) / (allSkills.length || 1);
  const readiness = avgScore >= 80 ? "advanced" : avgScore >= 60 ? "ready" : avgScore >= 40 ? "developing" : "beginner";
  await db.update(studentsTable).set({ overallScore: avgScore, readinessLevel: readiness }).where(eq(studentsTable.id, params.data.id));

  res.status(201).json({
    id: result.id,
    studentId: result.studentId,
    skillId: result.skillId,
    skillName: skill.name,
    category: skill.category,
    level: result.level,
    verified: result.verified,
    score: result.score,
    verifiedAt: result.verifiedAt ? result.verifiedAt.toISOString() : null,
  });
});

router.get("/students/:id/skill-gap", async (req, res): Promise<void> => {
  const params = GetSkillGapParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      skillName: skillsTable.name,
      category: skillsTable.category,
      level: studentSkillsTable.level,
      demandLevel: skillsTable.demandLevel,
    })
    .from(studentSkillsTable)
    .leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id))
    .where(eq(studentSkillsTable.studentId, params.data.id));

  const allSkills = await db.select().from(skillsTable);
  const studentSkillCategories = new Set(rows.map(r => r.category));

  // Generate gap analysis
  const gaps = [];
  const strengths: string[] = [];

  for (const row of rows) {
    const required = MARKET_REQUIREMENTS[row.category ?? "other"] ?? 3.0;
    const current = row.level ?? 0;
    const gap = Math.max(0, required - current);

    if (gap > 0) {
      gaps.push({
        skillName: row.skillName ?? "",
        currentLevel: current,
        requiredLevel: required,
        gap,
        priority: gap >= 3 ? "critical" : gap >= 2 ? "high" : gap >= 1 ? "medium" : "low",
        recommendation: `تحتاج إلى تطوير مهارة ${row.skillName} من المستوى ${current} إلى المستوى ${Math.ceil(required)}`,
      });
    } else {
      strengths.push(row.skillName ?? "");
    }
  }

  // Add missing market skills
  const coveredCategories = new Set(rows.map(r => r.category));
  for (const skill of allSkills.slice(0, 5)) {
    if (!coveredCategories.has(skill.category)) {
      gaps.push({
        skillName: skill.name,
        currentLevel: 0,
        requiredLevel: MARKET_REQUIREMENTS[skill.category] ?? 3.0,
        gap: MARKET_REQUIREMENTS[skill.category] ?? 3.0,
        priority: "high" as const,
        recommendation: `يُنصح بتعلم ${skill.name} لتعزيز فرصك في سوق العمل`,
      });
    }
  }

  const overallReadiness = rows.length === 0 ? 0 :
    Math.min(100, (rows.reduce((sum, r) => sum + ((r.level ?? 0) / (MARKET_REQUIREMENTS[r.category ?? "other"] ?? 3)), 0) / rows.length) * 100);

  res.json(GetSkillGapResponse.parse({
    studentId: params.data.id,
    overallReadiness,
    gaps: gaps.slice(0, 8),
    strengths,
  }));
});

router.get("/students/:id/investment-value", async (req, res): Promise<void> => {
  const params = GetInvestmentValueParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const skills = await db
    .select({ level: studentSkillsTable.level, demandLevel: skillsTable.demandLevel, marketWeight: skillsTable.marketWeight })
    .from(studentSkillsTable)
    .leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id))
    .where(eq(studentSkillsTable.studentId, params.data.id));

  const baseRate = 30; // SAR/hour base
  const demandMultiplier = skills.reduce((sum, s) => {
    const dm = s.demandLevel === "critical" ? 2.0 : s.demandLevel === "high" ? 1.5 : s.demandLevel === "medium" ? 1.2 : 1.0;
    return sum + dm * (s.marketWeight ?? 1.0) * (s.level ?? 1);
  }, 0) / (skills.length || 1);

  const rarityScore = Math.min(100, skills.filter(s => s.demandLevel === "critical" || s.demandLevel === "high").length * 15);
  const demandScore = Math.min(100, demandMultiplier * 20);
  const estimate = Math.round(baseRate * demandMultiplier);

  res.json(GetInvestmentValueResponse.parse({
    studentId: params.data.id,
    hourlyRateMin: Math.round(estimate * 0.8),
    hourlyRateMax: Math.round(estimate * 1.4),
    hourlyRateEstimate: estimate,
    currency: "ريال سعودي",
    rarityScore,
    demandScore,
    marketInsight: rarityScore > 60
      ? "مهاراتك نادرة وعالية الطلب في السوق السعودي — أنت في مكانة تفاوضية قوية"
      : "مهاراتك في تطور ومطلوبة — استمري في تطوير نفسك للوصول إلى أعلى المراتب",
  }));
});

router.get("/students/:id/career-paths", async (req, res): Promise<void> => {
  const params = GetCareerPathsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const skills = await db
    .select({ category: skillsTable.category, level: studentSkillsTable.level })
    .from(studentSkillsTable)
    .leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id))
    .where(eq(studentSkillsTable.studentId, params.data.id));

  const studentCategories = skills.reduce((acc: Record<string, number>, s) => {
    const cat = s.category ?? "other";
    acc[cat] = Math.max(acc[cat] ?? 0, s.level ?? 0);
    return acc;
  }, {});

  const paths = CAREER_SECTORS.map(sector => {
    const matchedCategories = sector.categories.filter(c => studentCategories[c] !== undefined);
    const matchScore = Math.round(
      (matchedCategories.reduce((sum, c) => sum + (studentCategories[c] ?? 0) / 5, 0) / sector.categories.length) * 100
    );

    const rolesByCategory: Record<string, string[]> = {
      programming: ["مطورة تطبيقات", "مهندسة برمجيات", "مطورة واجهة مستخدم"],
      design: ["مصممة تجربة مستخدم", "مصممة جرافيك", "مصممة منتج"],
      data: ["محللة بيانات", "مهندسة بيانات", "باحثة ذكاء اصطناعي"],
      management: ["مديرة مشاريع تقنية", "محللة أعمال", "مستشارة استراتيجية"],
      communication: ["منسقة مشاريع", "متخصصة تواصل رقمي"],
    };

    const roles = sector.categories.flatMap(c => (rolesByCategory[c] ?? []).slice(0, 1));

    return {
      sector: sector.sector,
      matchScore,
      roles,
      demandLevel: sector.demandLevel,
      salaryRange: sector.salaryRange,
      description: `قطاع ${sector.sector} يبحث بنشاط عن كفاءات تمتلك مهارات في ${sector.categories.join(" و")}`,
    };
  });

  paths.sort((a, b) => b.matchScore - a.matchScore);
  res.json(GetCareerPathsResponse.parse(paths));
});

export default router;
