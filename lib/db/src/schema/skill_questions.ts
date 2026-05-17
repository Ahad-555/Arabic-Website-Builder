import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { skillsTable } from "./skills";

export const skillQuestionsTable = pgTable("skill_questions", {
  id: serial("id").primaryKey(),
  skillId: integer("skill_id").notNull().references(() => skillsTable.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: text("correct_option").notNull(),
});

export type SkillQuestion = typeof skillQuestionsTable.$inferSelect;
