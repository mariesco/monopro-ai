import { z } from 'zod';
import { ConfusionMatrixTable } from './drizzle_schema.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertConfusionMatrixSchema =
  createInsertSchema(ConfusionMatrixTable);
export const selectConfusionMatrixSchema =
  createSelectSchema(ConfusionMatrixTable);

export type InsertConfusionMatrix = z.infer<typeof insertConfusionMatrixSchema>;
export type SelectConfusionMatrix = z.infer<typeof selectConfusionMatrixSchema>;
