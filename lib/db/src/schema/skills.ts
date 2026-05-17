import { pgTable, text, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skillsTable = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  category: text("category").notNull(),
  demandLevel: text("demand_level").notNull().default("medium"),
  marketWeight: real("market_weight").notNull().default(1.0),
  description: text("description"),
});

export const insertSkillSchema = createInsertSchema(skillsTable).omit({ id: true });
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skillsTable.$inferSelect;
