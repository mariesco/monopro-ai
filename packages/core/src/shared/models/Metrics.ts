import { z } from 'zod';
import { MetricsTable } from './drizzle_schema.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertMetricSchema = createInsertSchema(MetricsTable);
export const selectMetricSchema = createSelectSchema(MetricsTable);

export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type SelectMetric = z.infer<typeof selectMetricSchema>;
