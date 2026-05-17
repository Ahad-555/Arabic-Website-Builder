import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  technologies: text("technologies").array().notNull().default([]),
  githubUrl: text("github_url"),
  demoUrl: text("demo_url"),
  status: text("status").notNull().default("pending"),
  trustStamp: boolean("trust_stamp").notNull().default(false),
  aiScore: real("ai_score"),
  integrityNotes: text("integrity_notes"),
  quizQuestions: text("quiz_questions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
