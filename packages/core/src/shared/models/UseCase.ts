import { z } from 'zod';
import { UseCaseTable } from './drizzle_schema.js';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const insertUseCaseSchema = createInsertSchema(UseCaseTable);
export const selectUseCaseSchema = createSelectSchema(UseCaseTable);

export type InsertUseCase = z.infer<typeof insertUseCaseSchema>;
export type SelectUseCase = z.infer<typeof selectUseCaseSchema>;
