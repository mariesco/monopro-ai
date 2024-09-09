import { z } from 'zod';
import { ResponseClassTable } from './drizzle_schema.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertResponseClassSchema = createInsertSchema(ResponseClassTable);
export const selectResponseClassSchema = createSelectSchema(ResponseClassTable);

export type InsertResponseClass = z.infer<typeof insertResponseClassSchema>;
export type SelectResponseClass = z.infer<typeof selectResponseClassSchema>;
