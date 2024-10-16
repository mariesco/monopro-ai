import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  AIProviderTable,
  AIModelTable,
  AIModelConfigTable,
  AIModelBranchTable,
  AIModelPullRequestTable,
} from './drizzle_schema.js';

export const insertAIProviderSchema = createInsertSchema(AIProviderTable);
export const selectAIProviderSchema = createSelectSchema(AIProviderTable);

export const insertAIModelSchema = createInsertSchema(AIModelTable);
export const selectAIModelSchema = createSelectSchema(AIModelTable);
export const AIModelSchema = selectAIModelSchema.extend({
  capabilities: z.array(z.string()),
});

export const insertAIModelConfigSchema = createInsertSchema(
  AIModelConfigTable,
  {
    temperature: z.number().min(0).max(1).optional(),
    topP: z.number().min(0).max(1).optional(),
    presencePenalty: z.number().optional(),
    frequencyPenalty: z.number().optional(),
  },
);

export const selectAIModelConfigSchema = createSelectSchema(
  AIModelConfigTable,
  {
    temperature: z.number().min(0).max(1).optional(),
    topP: z.number().min(0).max(1).optional(),
    presencePenalty: z.number().optional(),
    frequencyPenalty: z.number().optional(),
  },
);

export const insertAIModelBranchSchema = z.object({
  modelId: z.number(),
  organizationId: z.string(),
  name: z.string(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().optional(),
  presencePenalty: z.number().optional(),
  frequencyPenalty: z.number().optional(),
  stopSequences: z.array(z.string()).optional(),
  seed: z.number().optional(),
});

export const selectAIModelBranchSchema = createSelectSchema(AIModelBranchTable);
export const getModelBranchSchema = selectAIModelBranchSchema.extend({
  config: selectAIModelConfigSchema,
  relatedFeatures: z.array(z.string()),
  isProductionForAnyFeature: z.boolean(),
});

export type GetModelBranch = z.infer<typeof getModelBranchSchema>;

export const insertAIModelPullRequestSchema = createInsertSchema(
  AIModelPullRequestTable,
);
export const selectAIModelPullRequestSchema = createSelectSchema(
  AIModelPullRequestTable,
);

export const AIModelPullRequestSchema = selectAIModelPullRequestSchema.extend({
  status: z.enum(['open', 'closed', 'merged']),
});

export type InsertAIProvider = z.infer<typeof insertAIProviderSchema>;
export type SelectAIProvider = z.infer<typeof selectAIProviderSchema>;

export type InsertAIModel = z.infer<typeof insertAIModelSchema>;
export type SelectAIModel = z.infer<typeof selectAIModelSchema>;
export type AIModel = z.infer<typeof AIModelSchema>;

export type InsertAIModelConfig = z.infer<typeof insertAIModelConfigSchema>;
export type SelectAIModelConfig = z.infer<typeof selectAIModelConfigSchema>;

export type InsertAIModelBranch = z.infer<typeof insertAIModelBranchSchema>;
export type SelectAIModelBranch = z.infer<typeof selectAIModelBranchSchema>;

export type InsertAIModelPullRequest = z.infer<
  typeof insertAIModelPullRequestSchema
>;
export type SelectAIModelPullRequest = z.infer<
  typeof selectAIModelPullRequestSchema
>;
export type AIModelPullRequest = z.infer<typeof AIModelPullRequestSchema>;

export type SelectAIModelBranchWithConfig = SelectAIModelBranch & {
  config: SelectAIModelConfig;
};
