import { pgTable, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { skillsTable } from "./skills";

export const studentSkillsTable = pgTable("student_skills", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  skillId: integer("skill_id").notNull().references(() => skillsTable.id),
  level: integer("level").notNull().default(1),
  verified: boolean("verified").notNull().default(false),
  score: real("score").notNull().default(0),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

export const insertStudentSkillSchema = createInsertSchema(studentSkillsTable).omit({ id: true });
export type InsertStudentSkill = z.infer<typeof insertStudentSkillSchema>;
export type StudentSkill = typeof studentSkillsTable.$inferSelect;
