import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, skillQuestionsTable, quizAttemptsTable, studentSkillsTable, studentsTable, skillsTable, activityTable } from "@workspace/db";

const router = Router();

router.get("/students/:id/quiz/:skillId", async (req, res): Promise<void> => {
  const studentId = parseInt(req.params.id);
  const skillId = parseInt(req.params.skillId);
  if (isNaN(studentId) || isNaN(skillId)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }
  const questions = await db.select().from(skillQuestionsTable).where(eq(skillQuestionsTable.skillId, skillId));
  if (questions.length === 0) {
    res.status(404).json({ error: "No questions found for this skill" });
    return;
  }
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, Math.min(5, questions.length));
  res.json(shuffled.map(q => ({
    id: q.id,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
  })));
});

router.post("/students/:id/quiz/:skillId/submit", async (req, res): Promise<void> => {
  const studentId = parseInt(req.params.id);
  const skillId = parseInt(req.params.skillId);
  if (isNaN(studentId) || isNaN(skillId)) {
    res.status(400).json({ error: "Invalid ids" });
    return;
  }
  const { answers } = req.body;
  if (!answers || typeof answers !== "object") {
    res.status(400).json({ error: "answers object required" });
    return;
  }

  const questionIds = Object.keys(answers).map(Number);
  const questions = await db.select().from(skillQuestionsTable).where(eq(skillQuestionsTable.skillId, skillId));
  const answeredQuestions = questions.filter(q => questionIds.includes(q.id));

  if (answeredQuestions.length === 0) {
    res.status(400).json({ error: "No valid answers provided" });
    return;
  }

  const correct = answeredQuestions.filter(q => answers[q.id] === q.correctOption).length;
  const total = answeredQuestions.length;
  const score = Math.round((correct / total) * 100);
  const passed = score >= 60;

  const [attempt] = await db.insert(quizAttemptsTable).values({
    studentId, skillId, score, passed,
  }).returning();

  if (passed) {
    const [existing] = await db.select().from(studentSkillsTable)
      .where(and(eq(studentSkillsTable.studentId, studentId), eq(studentSkillsTable.skillId, skillId)));
    if (existing) {
      await db.update(studentSkillsTable)
        .set({ score, verified: true, verifiedAt: new Date() })
        .where(eq(studentSkillsTable.id, existing.id));
    } else {
      await db.insert(studentSkillsTable).values({
        studentId, skillId, level: 3, score, verified: true, verifiedAt: new Date(),
      });
    }
    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
    const [skill] = await db.select().from(skillsTable).where(eq(skillsTable.id, skillId));
    if (student && skill) {
      await db.insert(activityTable).values({
        type: "quiz_passed",
        message: `اجتازت اختبار ${skill.name} بنتيجة ${score}%`,
        studentName: student.name,
        studentId,
      });
      const allSkills = await db.select().from(studentSkillsTable).where(eq(studentSkillsTable.studentId, studentId));
      const avgScore = allSkills.reduce((sum, s) => sum + s.score, 0) / (allSkills.length || 1);
      const readiness = avgScore >= 80 ? "advanced" : avgScore >= 60 ? "ready" : avgScore >= 40 ? "developing" : "beginner";
      await db.update(studentsTable).set({ overallScore: avgScore, readinessLevel: readiness }).where(eq(studentsTable.id, studentId));
    }
  }

  res.json({ score, passed, correct, total, attemptId: attempt.id });
});

export default router;
