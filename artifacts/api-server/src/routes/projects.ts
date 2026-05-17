import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, studentsTable, activityTable } from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  GetProjectResponse,
  ListProjectsResponse,
  VerifyProjectParams,
  VerifyProjectBody,
  VerifyProjectResponse,
  GenerateProjectQuizParams,
  GenerateProjectQuizResponse,
  SubmitProjectQuizParams,
  SubmitProjectQuizBody,
  SubmitProjectQuizResponse,
  GetStudentProjectsParams,
  GetStudentProjectsResponse,
} from "@workspace/api-zod";

const router = Router();

function formatProject(p: typeof projectsTable.$inferSelect, studentName: string) {
  return {
    id: p.id,
    studentId: p.studentId,
    studentName,
    title: p.title,
    description: p.description,
    technologies: p.technologies,
    githubUrl: p.githubUrl,
    demoUrl: p.demoUrl,
    status: p.status,
    trustStamp: p.trustStamp,
    aiScore: p.aiScore,
    integrityNotes: p.integrityNotes,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/projects", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      project: projectsTable,
      studentName: studentsTable.name,
    })
    .from(projectsTable)
    .leftJoin(studentsTable, eq(projectsTable.studentId, studentsTable.id))
    .orderBy(projectsTable.createdAt);

  res.json(ListProjectsResponse.parse(rows.map(r => formatProject(r.project, r.studentName ?? ""))));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parsed.data.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    ...parsed.data,
    status: "pending",
  }).returning();

  await db.insert(activityTable).values({
    type: "skill_added",
    message: `رفعت مشروع جديد: ${project.title}`,
    studentName: student.name,
    studentId: student.id,
  });

  res.status(201).json(GetProjectResponse.parse(formatProject(project, student.name)));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select({ project: projectsTable, studentName: studentsTable.name })
    .from(projectsTable)
    .leftJoin(studentsTable, eq(projectsTable.studentId, studentsTable.id))
    .where(eq(projectsTable.id, params.data.id));

  if (!rows.length) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(formatProject(rows[0].project, rows[0].studentName ?? "")));
});

router.post("/projects/:id/verify", async (req, res): Promise<void> => {
  const params = VerifyProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = VerifyProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Simulate AI integrity analysis
  const codeLength = parsed.data.codeSnippet.length;
  const hasComments = parsed.data.codeSnippet.includes("//") || parsed.data.codeSnippet.includes("#");
  const originality = Math.min(100, 50 + (codeLength / 10) + (hasComments ? 20 : 0));
  const aiScore = Math.round(originality * 0.9);
  const passed = aiScore >= 60;

  const integrityNotes = passed
    ? "تحليل الذكاء الاصطناعي يُظهر أصالة عالية في منطق المشروع وبنيته البرمجية"
    : "يحتاج المشروع إلى مزيد من التوثيق والدليل على الملكية الفكرية";

  await db.update(projectsTable)
    .set({ status: passed ? "verified" : "analyzing", aiScore, integrityNotes })
    .where(eq(projectsTable.id, params.data.id));

  res.json(VerifyProjectResponse.parse({
    projectId: params.data.id,
    passed,
    aiScore,
    summary: integrityNotes,
    originality,
    integrityNotes,
  }));
});

router.post("/projects/:id/quiz", async (req, res): Promise<void> => {
  const params = GenerateProjectQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const tech = project.technologies[0] ?? "البرمجة";
  const questions = [
    {
      id: 1,
      question: `ما هي الأسباب التي جعلتك تختار ${tech} في هذا المشروع؟`,
      options: [
        `${tech} يوفر أداءً عالياً وتوافقاً مع متطلبات المشروع`,
        "اخترته عشوائياً دون دراسة",
        "هو الوحيد الذي أعرفه",
        "أوصى به أحد الأصدقاء فقط"
      ]
    },
    {
      id: 2,
      question: `ما هو أصعب تحدٍ واجهتِه أثناء تطوير "${project.title}"؟`,
      options: [
        "إدارة حالات الخطأ والتحقق من المدخلات",
        "تحديد اسم المشروع",
        "اختيار لون الواجهة",
        "لم أواجه أي تحديات"
      ]
    },
    {
      id: 3,
      question: "كيف تتعاملين مع إدارة الحالة (State Management) في مشروعك؟",
      options: [
        "أستخدم نهجاً محدداً ومناسباً لحجم المشروع مع توثيق القرارات",
        "لا أعرف ما هي إدارة الحالة",
        "أترك كل شيء بدون تنظيم",
        "أنسخ الحل من الإنترنت مباشرة"
      ]
    },
    {
      id: 4,
      question: `لو طلب منك مطور آخر تعديل جزء محدد من كود "${project.title}"، كيف تشرحين له البنية؟`,
      options: [
        "أشرح البنية المعمارية والمسؤوليات بشكل واضح مع توثيق موجود",
        "لا أستطيع الشرح لأنني لا أفهمه أنا أيضاً",
        "أرسل له الكود كاملاً دون شرح",
        "أقول له يبحث بنفسه"
      ]
    },
    {
      id: 5,
      question: "ما هي الخطوة التالية لتطوير هذا المشروع بعد نسخته الحالية؟",
      options: [
        "إضافة ميزات محددة بناءً على تحليل احتياجات المستخدمين",
        "لا أعرف، المشروع انتهى",
        "تغيير اسم المشروع",
        "حذف المشروع وبدء واحد جديد"
      ]
    }
  ];

  // Store quiz questions in project
  await db.update(projectsTable)
    .set({ quizQuestions: JSON.stringify(questions), status: "analyzing" })
    .where(eq(projectsTable.id, params.data.id));

  res.json(GenerateProjectQuizResponse.parse({
    projectId: params.data.id,
    questions,
  }));
});

router.post("/projects/:id/quiz/submit", async (req, res): Promise<void> => {
  const params = SubmitProjectQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitProjectQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Correct answers are always index 0 (first option)
  const correctCount = parsed.data.answers.filter(a => a.answer === "0" || a.answer.includes("أستخدم") || a.answer.includes("أشرح") || a.answer.includes("إضافة") || a.answer.includes("يوفر") || a.answer.includes("إدارة")).length;
  const score = Math.round((correctCount / Math.max(parsed.data.answers.length, 1)) * 100);
  const passed = score >= 60;

  if (passed) {
    await db.update(projectsTable)
      .set({ trustStamp: true, status: "verified" })
      .where(eq(projectsTable.id, params.data.id));

    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, project.studentId));
    if (student) {
      await db.insert(activityTable).values({
        type: "project_verified",
        message: `اجتازت اختبار المشروع: ${project.title} وحصلت على ختم الموثوقية`,
        studentName: student.name,
        studentId: student.id,
      });
    }
  }

  res.json(SubmitProjectQuizResponse.parse({
    projectId: params.data.id,
    passed,
    score,
    feedback: passed
      ? "أثبتِ إتقانك وفهمك الكامل للكود — تم منح ختم الموثوقية للمشروع"
      : "يحتاج المشروع إلى مزيد من الإتقان — راجعي كودك وحاولي مرة أخرى",
    trustStampGranted: passed,
  }));
});

router.get("/students/:id/projects", async (req, res): Promise<void> => {
  const params = GetStudentProjectsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const projects = await db.select().from(projectsTable).where(eq(projectsTable.studentId, params.data.id));
  res.json(GetStudentProjectsResponse.parse(projects.map(p => formatProject(p, student.name))));
});

export default router;
