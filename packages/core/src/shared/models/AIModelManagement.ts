import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  AIProviderTable,
  AIModelTable,
  AIModelConfigTable,
  AIModelBranchTable,
  AIModelPullRequestTable
} from './drizzle_schema.js';

export const insertAIProviderSchema = createInsertSchema(AIProviderTable);
export const selectAIProviderSchema = createSelectSchema(AIProviderTable);

export const insertAIModelSchema = createInsertSchema(AIModelTable);
export const selectAIModelSchema = createSelectSchema(AIModelTable);

export const insertAIModelConfigSchema = createInsertSchema(AIModelConfigTable, {
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
});

export const selectAIModelConfigSchema = createSelectSchema(AIModelConfigTable, {
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
});

export const insertAIModelBranchSchema = createInsertSchema(AIModelBranchTable);
export const selectAIModelBranchSchema = createSelectSchema(AIModelBranchTable);

export const insertAIModelPullRequestSchema = createInsertSchema(AIModelPullRequestTable);
export const selectAIModelPullRequestSchema = createSelectSchema(AIModelPullRequestTable);

export const AIModelPullRequestSchema = selectAIModelPullRequestSchema.extend({
  status: z.enum(['open', 'closed', 'merged']),
});

export type AIModelPullRequest = z.infer<typeof AIModelPullRequestSchema>;

export type InsertAIProvider = z.infer<typeof insertAIProviderSchema>;
export type SelectAIProvider = z.infer<typeof selectAIProviderSchema>;

export type InsertAIModel = z.infer<typeof insertAIModelSchema>;
export type SelectAIModel = z.infer<typeof selectAIModelSchema>;

export type InsertAIModelConfig = z.infer<typeof insertAIModelConfigSchema>;
export type SelectAIModelConfig = z.infer<typeof selectAIModelConfigSchema>;

export type InsertAIModelBranch = z.infer<typeof insertAIModelBranchSchema>;
export type SelectAIModelBranch = z.infer<typeof selectAIModelBranchSchema>;

export type InsertAIModelPullRequest = z.infer<typeof insertAIModelPullRequestSchema>;
export type SelectAIModelPullRequest = z.infer<typeof selectAIModelPullRequestSchema>;
