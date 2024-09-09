import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  AIPromptTable,
  AIResponseTable,
  AIStringTable,
} from './drizzle_schema.js';

export const insertAIStringSchema = createInsertSchema(AIStringTable);
export const selectAIStringSchema = createSelectSchema(AIStringTable);

export const insertAIResponseSchema = createInsertSchema(AIResponseTable);
export const selectAIResponseSchema = createSelectSchema(AIResponseTable);
export const AIResponseSchema = z.object({
  id: z.number(),
  stringsIds: z.array(z.number()),
  promptId: z.number(),
  content: z.string(),
  createdAt: z.date(),
});

export const insertAIPromptSchema = createInsertSchema(AIPromptTable);
export const selectAIPromptSchema = createSelectSchema(AIPromptTable);
export const AIPromptSchema = z.object({
  id: z.number(),
  stringsIds: z.array(z.number()),
  content: z.string(),
  //response: AIResponseSchema,
  featureId: z.number(),
  createdAt: z.date(),
});

export type InsertAIString = z.infer<typeof insertAIStringSchema>;
export type SelectAIString = z.infer<typeof selectAIStringSchema>;

export type InsertAIResponse = z.infer<typeof insertAIResponseSchema>;
export type SelectAIResponse = z.infer<typeof selectAIResponseSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;

export type InsertAIPrompt = z.infer<typeof insertAIPromptSchema>;
export type SelectAIPrompt = z.infer<typeof selectAIPromptSchema>;
export type AIPrompt = z.infer<typeof AIPromptSchema>;
