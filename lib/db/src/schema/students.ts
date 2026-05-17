import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  studentId: text("student_id").notNull().unique(),
  major: text("major").notNull(),
  year: integer("year").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  overallScore: real("overall_score").notNull().default(0),
  readinessLevel: text("readiness_level").notNull().default("beginner"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
