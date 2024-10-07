import { z } from 'zod';
import { EmitProgressDataSchema } from '../types/DataProcessingTypes.js';

export const DataProcessingProgressParamsSchema = z.object({
  stage: z.string(),
  progress: z.number().min(0).max(100),
  useCasesToProcess: z.number(),
  data: EmitProgressDataSchema,
});

export type DataProcessingProgressParams = z.infer<
  typeof DataProcessingProgressParamsSchema
>;

export const DataProcessinProgressCallbackSchema = z
  .function()
  .args(DataProcessingProgressParamsSchema)
  .returns(z.void());

export type DataProcessingProgressCallback = z.infer<
  typeof DataProcessinProgressCallbackSchema
>;
