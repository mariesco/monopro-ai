import { z } from 'zod';

export const FeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  purpose: z.string(),
  model: z.string(),
  expectedClasses: z.array(z.string()),
  createdAt: z.date().default(new Date()),
});

export type Feature = z.infer<typeof FeatureSchema>;
