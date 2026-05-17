import { pgTable, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { studentsTable } from "./students";
import { skillsTable } from "./skills";

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skillsTable.id),
  score: real("score").notNull(),
  passed: boolean("passed").notNull().default(false),
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
});

export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
