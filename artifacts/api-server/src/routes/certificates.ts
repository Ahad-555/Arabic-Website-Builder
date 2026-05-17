import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, certificatesTable, studentsTable, studentSkillsTable, skillsTable, projectsTable, activityTable } from "@workspace/db";
import {
  GetCertificateParams,
  GetCertificateResponse,
  GetCertificateByCodeParams,
  GetCertificateByCodeResponse,
} from "@workspace/api-zod";
import { randomBytes } from "crypto";

const router = Router();

async function buildCertificate(cert: typeof certificatesTable.$inferSelect, student: typeof studentsTable.$inferSelect) {
  const skillRows = await db
    .select({
      skillName: skillsTable.name,
      level: studentSkillsTable.level,
      verified: studentSkillsTable.verified,
    })
    .from(studentSkillsTable)
    .leftJoin(skillsTable, eq(studentSkillsTable.skillId, skillsTable.id))
    .where(eq(studentSkillsTable.studentId, student.id));

  const projectRows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.studentId, student.id));

  return {
    id: cert.id,
    studentId: student.id,
    studentName: student.name,
    major: student.major,
    overallScore: cert.overallScore,
    readinessLevel: cert.readinessLevel,
    qrCode: cert.qrCode,
    skills: skillRows.map(s => ({
      name: s.skillName ?? "",
      level: s.level,
      verified: s.verified,
      aiVerified: s.verified,
    })),
    projects: projectRows.map(p => ({
      title: p.title,
      technologies: p.technologies,
      trustStamp: p.trustStamp,
    })),
    issuedAt: cert.issuedAt.toISOString(),
  };
}

router.get("/students/:id/certificate", async (req, res): Promise<void> => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, params.data.id));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  let [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.studentId, params.data.id));

  // Auto-generate certificate if student has score > 0
  if (!cert && student.overallScore > 0) {
    const qrCode = randomBytes(8).toString("hex").toUpperCase();
    [cert] = await db.insert(certificatesTable).values({
      studentId: student.id,
      qrCode,
      overallScore: student.overallScore,
      readinessLevel: student.readinessLevel,
    }).returning();

    await db.insert(activityTable).values({
      type: "certificate_issued",
      message: `تم إصدار صك الجدارة المهنية`,
      studentName: student.name,
      studentId: student.id,
    });
  }

  if (!cert) {
    res.status(404).json({ error: "No certificate issued yet — add skills and projects to qualify" });
    return;
  }

  const data = await buildCertificate(cert, student);
  res.json(GetCertificateResponse.parse(data));
});

router.get("/certificates/:code", async (req, res): Promise<void> => {
  const params = GetCertificateByCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cert] = await db.select().from(certificatesTable).where(eq(certificatesTable.qrCode, params.data.code));
  if (!cert) {
    res.status(404).json({ error: "Certificate not found" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, cert.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const data = await buildCertificate(cert, student);
  res.json(GetCertificateByCodeResponse.parse(data));
});

export default router;
