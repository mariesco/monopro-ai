import { z } from 'zod';

export const MetricSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.number(),
  promptId: z.string().uuid(),
  createdAt: z.date().default(new Date()),
});

export type Metric = z.infer<typeof MetricSchema>;
