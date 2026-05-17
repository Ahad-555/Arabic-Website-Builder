import { Router } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, studentsTable, studentSkillsTable, skillsTable, quizAttemptsTable } from "@workspace/db";
import {
  CreateStudentBody,
  GetStudentParams,
  GetStudentResponse,
  UpdateStudentParams,
  UpdateStudentBody,
  UpdateStudentResponse,
  ListStudentsResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/students", async (_req, res): Promise<void> => {
  const students = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);
  res.json(ListStudentsResponse.parse(students.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))));
});

router.get("/students/by-name", async (req, res): Promise<void> => {
  const name = req.query.name as string;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const students = await db.select().from(studentsTable).where(ilike(studentsTable.name, name.trim()));
  if (students.length === 0) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const s = students[0];
  res.json({ ...s, createdAt: s.createdAt.toISOString() });
});

router.post("/students", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const studentId = `NBU-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const [student] = await db.insert(studentsTable).values({
    name: body.name.trim(),
    studentId,
    college: body.college || "كلية الحاسبات وتقنية المعلومات",
    major: body.major || body.specialty || "غير محدد",
    year: body.year || 1,
  }).returning();
  res.status(201).json({ ...student, createdAt: student.createdAt.toISOString() });
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(GetStudentResponse.parse({ ...student, createdAt: student.createdAt.toISOString() }));
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.update(studentsTable).set(parsed.data).where(eq(studentsTable.id, params.data.id)).returning();
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  res.json(UpdateStudentResponse.parse({ ...student, createdAt: student.createdAt.toISOString() }));
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  res.json({ success: true });
});

export default router;
