import { z } from 'zod';
import { FeatureTable } from './drizzle_schema.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { AIPromptSchema } from './AIModel.js';
import { selectUseCaseSchema } from './UseCase.js';
import { selectResponseClassSchema } from './ResponseClass.js';

export const insertFeatureSchema = createInsertSchema(FeatureTable);
export const selectFeatureSchema = createSelectSchema(FeatureTable);
export const FeatureSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  model: z.string(),
  url: z.string(),
  prompts: z.array(AIPromptSchema),
  useCases: z.array(selectUseCaseSchema),
  responseClasses: z.array(selectResponseClassSchema),
});

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type SelectFeature = z.infer<typeof selectFeatureSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
