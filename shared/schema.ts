import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: integer("ticket_number").notNull().unique(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  application: text("application").notNull(),
  description: text("description").notNull(),
  errorCode: text("error_code"),
  status: text("status").notNull().default("new"),
  severity: text("severity").notNull().default("medium"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id"),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const kbArticles = pgTable("kb_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  application: text("application").notNull(),
  problem: text("problem").notNull(),
  cause: text("cause").notNull(),
  solution: text("solution").notNull(),
  steps: text("steps").array().notNull(),
});

export const logAnalyses = pgTable("log_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  errorPattern: text("error_pattern").notNull(),
  rootCause: text("root_cause").notNull(),
  suggestedFix: text("suggested_fix").notNull(),
  logExcerpt: text("log_excerpt").notNull(),
  correlatedEvent: text("correlated_event"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertKBArticleSchema = createInsertSchema(kbArticles).omit({
  id: true,
});

export const insertLogAnalysisSchema = createInsertSchema(logAnalyses).omit({
  id: true,
  createdAt: true,
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type KBArticle = typeof kbArticles.$inferSelect;
export type InsertKBArticle = z.infer<typeof insertKBArticleSchema>;
export type LogAnalysis = typeof logAnalyses.$inferSelect;
export type InsertLogAnalysis = z.infer<typeof insertLogAnalysisSchema>;

export type TicketStatus = "new" | "log_analysis" | "in_progress" | "fix_applied" | "resolved";
export type MessageRole = "user" | "cerebro" | "system" | "technician";
export type Severity = "low" | "medium" | "high" | "critical";
