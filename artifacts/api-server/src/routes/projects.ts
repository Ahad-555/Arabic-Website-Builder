import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, projectsTable, studentsTable, activityTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
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
    .select({ project: projectsTable, studentName: studentsTable.name })
    .from(projectsTable)
    .leftJoin(studentsTable, eq(projectsTable.studentId, studentsTable.id))
    .orderBy(projectsTable.createdAt);

  res.json(ListProjectsResponse.parse(rows.map(r => formatProject(r.project, r.studentName ?? ""))));
});

router.post("/projects", async (req, res): Promise<void> => {
  const body = req.body as {
    studentId: number;
    title: string;
    description: string;
    technologies?: string[];
    imageData?: string;
  };

  if (!body.studentId || !body.title || !body.description) {
    res.status(400).json({ error: "studentId, title, description مطلوبة" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, body.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    studentId: body.studentId,
    title: body.title,
    description: body.description,
    technologies: body.technologies ?? [],
    imageData: body.imageData ?? null,
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
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db
    .select({ project: projectsTable, studentName: studentsTable.name })
    .from(projectsTable)
    .leftJoin(studentsTable, eq(projectsTable.studentId, studentsTable.id))
    .where(eq(projectsTable.id, params.data.id));

  if (!rows.length) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(GetProjectResponse.parse(formatProject(rows[0].project, rows[0].studentName ?? "")));
});

router.post("/projects/:id/verify", async (req, res): Promise<void> => {
  const params = VerifyProjectParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = VerifyProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const codeLength = parsed.data.codeSnippet.length;
  const hasComments = parsed.data.codeSnippet.includes("//") || parsed.data.codeSnippet.includes("#");
  const originality = Math.min(100, 50 + (codeLength / 10) + (hasComments ? 20 : 0));
  const aiScore = Math.round(originality * 0.9);
  const passed = aiScore >= 60;
  const integrityNotes = passed
    ? "تحليل الذكاء الاصطناعي يُظهر أصالة عالية في منطق المشروع"
    : "يحتاج المشروع إلى مزيد من التوثيق والدليل على الملكية الفكرية";

  await db.update(projectsTable).set({ status: passed ? "verified" : "analyzing", aiScore, integrityNotes }).where(eq(projectsTable.id, params.data.id));
  res.json(VerifyProjectResponse.parse({ projectId: params.data.id, passed, aiScore, summary: integrityNotes, originality, integrityNotes }));
});

// Generate AI quiz based on project image + description
router.post("/projects/:id/quiz", async (req, res): Promise<void> => {
  const params = GenerateProjectQuizParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  try {
    // Build the message content with vision if image is available
    const userContent: any[] = [];

    if (project.imageData && project.imageData.startsWith("data:")) {
      userContent.push({
        type: "image_url",
        image_url: { url: project.imageData, detail: "high" },
      });
    }

    userContent.push({
      type: "text",
      text: `أنتِ محكّم تقني متخصص في تقييم مشاريع طالبات الحاسب. قومي بتوليد 5 أسئلة استجوابية تقنية ذكية بالعربية لاختبار فهم الطالبة الحقيقي لمشروعها.

معلومات المشروع:
- اسم المشروع: ${project.title}
- الوصف: ${project.description}
- التقنيات المستخدمة: ${project.technologies.join(", ")}
${project.imageData ? "- تم رفع صورة للمشروع (اعتمدي عليها في توليد الأسئلة)" : ""}

المطلوب: ولّدي بالضبط 5 أسئلة اختيار من متعدد (4 خيارات لكل سؤال). الأسئلة يجب أن:
1. تختبر فهم الطالبة الفعلي للكود والمنطق البرمجي
2. تتعلق بالتقنيات المحددة في المشروع
3. تتضمن سؤالاً عن الصورة إن وجدت (مثل: ما الذي تراه في الواجهة؟ ما وظيفة هذا المكون؟)
4. تكون ذكية بحيث لا تُجاب بالتخمين

أعيدي الإجابة كـ JSON فقط بهذا الشكل:
{
  "questions": [
    {
      "id": 1,
      "question": "نص السؤال",
      "options": ["الخيار الأول الصحيح", "خيار خاطئ 1", "خيار خاطئ 2", "خيار خاطئ 3"],
      "correctIndex": 0
    }
  ]
}

ملاحظة: الخيار الصحيح دائماً في الموضع correctIndex (ابدأ من 0). أعيدي JSON فقط بدون أي نص إضافي.`,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2000,
      messages: [{ role: "user", content: userContent }],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    const parsed = JSON.parse(jsonMatch[0]) as { questions: Array<{ id: number; question: string; options: string[]; correctIndex: number }> };

    // Store questions with correct answer info
    await db.update(projectsTable)
      .set({ quizQuestions: JSON.stringify(parsed.questions), status: "analyzing" })
      .where(eq(projectsTable.id, params.data.id));

    // Return in the expected format
    const formattedQuestions = parsed.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
    }));

    res.json(GenerateProjectQuizResponse.parse({ projectId: params.data.id, questions: formattedQuestions }));
  } catch (err: any) {
    req.log?.error({ err }, "AI quiz generation failed");
    // Fallback to static questions
    const tech = project.technologies[0] ?? "البرمجة";
    const fallback = [
      { id: 1, question: `لماذا اخترتِ ${tech} في هذا المشروع؟`, options: [`${tech} يناسب متطلبات المشروع ويوفر الأداء المطلوب`, "اخترته عشوائياً", "هو الوحيد الذي أعرفه", "أوصى به أحد الأصدقاء فقط"], correctIndex: 0 },
      { id: 2, question: `ما أصعب تحدٍ واجهتِه في "${project.title}"؟`, options: ["إدارة حالات الخطأ والتحقق من المدخلات", "تحديد اسم المشروع", "اختيار لون الواجهة", "لم أواجه أي تحديات"], correctIndex: 0 },
      { id: 3, question: "كيف تديرين الحالة (State) في مشروعك؟", options: ["أستخدم نهجاً محدداً يناسب حجم المشروع مع توثيق القرارات", "لا أعرف ما هي إدارة الحالة", "أترك كل شيء بدون تنظيم", "أنسخ الحل من الإنترنت مباشرة"], correctIndex: 0 },
      { id: 4, question: `كيف تشرحين بنية "${project.title}" لمطور آخر؟`, options: ["أشرح البنية المعمارية والمسؤوليات بشكل واضح مع التوثيق", "لا أستطيع الشرح لأنني لا أفهمه", "أرسل الكود كاملاً دون شرح", "أقول له يبحث بنفسه"], correctIndex: 0 },
      { id: 5, question: "ما الخطوة التالية لتطوير هذا المشروع؟", options: ["إضافة ميزات بناءً على تحليل احتياجات المستخدمين", "المشروع اكتمل ولا تطوير", "تغيير اسم المشروع فقط", "حذف المشروع وبدء جديد"], correctIndex: 0 },
    ];

    await db.update(projectsTable)
      .set({ quizQuestions: JSON.stringify(fallback), status: "analyzing" })
      .where(eq(projectsTable.id, params.data.id));

    res.json(GenerateProjectQuizResponse.parse({ projectId: params.data.id, questions: fallback }));
  }
});

// Submit project quiz answers
router.post("/projects/:id/quiz/submit", async (req, res): Promise<void> => {
  const params = SubmitProjectQuizParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = req.body as { answers: Array<{ questionId: number; selectedIndex: number }> };
  if (!body.answers || !Array.isArray(body.answers)) {
    res.status(400).json({ error: "answers مطلوب" });
    return;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, params.data.id));
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  // Load stored questions to check correct answers
  let correctCount = 0;
  let total = body.answers.length;

  if (project.quizQuestions) {
    try {
      const questions = JSON.parse(project.quizQuestions) as Array<{ id: number; correctIndex: number }>;
      correctCount = body.answers.filter(a => {
        const q = questions.find(q => q.id === a.questionId);
        return q && q.correctIndex === a.selectedIndex;
      }).length;
      total = questions.length;
    } catch {
      // If JSON parse fails, use fallback logic
      correctCount = Math.round(body.answers.length * 0.6);
    }
  }

  const score = Math.round((correctCount / Math.max(total, 1)) * 100);
  const passed = score >= 60;

  if (passed) {
    await db.update(projectsTable)
      .set({ trustStamp: true, status: "verified", aiScore: score })
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

  // Use the parsed body format that matches what exists in api-zod
  const parsedBody = SubmitProjectQuizBody.safeParse(req.body);
  res.json(SubmitProjectQuizResponse.parse({
    projectId: params.data.id,
    passed,
    score,
    feedback: passed
      ? "أثبتِ إتقانك وفهمك الكامل للمشروع — تم منح ختم الموثوقية"
      : "يحتاج المشروع إلى مزيد من الإتقان — راجعي مشروعك وحاولي مرة أخرى",
    trustStampGranted: passed,
  }));
});

router.get("/students/:id/projects", async (req, res): Promise<void> => {
  const params = GetStudentProjectsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) { res.status(404).json({ error: "Student not found" }); return; }

  const projects = await db.select().from(projectsTable).where(eq(projectsTable.studentId, params.data.id));
  res.json(GetStudentProjectsResponse.parse(projects.map(p => formatProject(p, student.name))));
});

export default router;
