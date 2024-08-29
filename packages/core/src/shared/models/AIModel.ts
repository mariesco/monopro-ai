import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  AIPromptTable,
  AIResponseTable,
  AIStringTable,
} from './drizzle_schema.js';

export const insertAIStringSchema = createInsertSchema(AIStringTable);
export const selectAIStringSchema = createSelectSchema(AIStringTable);

export const insertAIPromptSchema = createInsertSchema(AIPromptTable);
export const selectAIPromptSchema = createSelectSchema(AIPromptTable);

export const insertAIResponseSchema = createInsertSchema(AIResponseTable);
export const selectAIResponseSchema = createSelectSchema(AIResponseTable);

export type InsertAIString = z.infer<typeof insertAIStringSchema>;
export type SelectAIString = z.infer<typeof selectAIStringSchema>;

export type InsertAIPrompt = z.infer<typeof insertAIPromptSchema>;
export type SelectAIPrompt = z.infer<typeof selectAIPromptSchema>;

export type InsertAIResponse = z.infer<typeof insertAIResponseSchema>;
export type SelectAIResponse = z.infer<typeof selectAIResponseSchema>;
