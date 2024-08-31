import { z } from 'zod';
import { FeatureTable } from './drizzle_schema.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertFeatureSchema = createInsertSchema(FeatureTable);
export const selectFeatureSchema = createSelectSchema(FeatureTable);

export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type SelectFeature = z.infer<typeof selectFeatureSchema>;
