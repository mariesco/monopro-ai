import { z } from 'zod';
import type { SelectMetric } from '../../../../../shared/models/Metrics.js';

export const UseCaseForEmitProgressSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  generatedResponse: z.string().optional(),
  confusionMatrix: z
    .object({
      truePositives: z.number(),
      falsePositives: z.number(),
      trueNegatives: z.number(),
      falseNegatives: z.number(),
    })
    .optional(),
});

export type UseCaseForEmitProgress = z.infer<
  typeof UseCaseForEmitProgressSchema
>;

export const MetricForEmitProgressSchema = z.object({
  name: z.string(),
  value: z.string().refine(
    (val) => {
      const percentagePattern = /^\d{1,3}(\.\d{1,2})?%$/;
      const bitsPattern = /^\d+(\.\d{1,2})?\sbits$/;
      const numberPattern = /^\d+(\.\d{1,2})?$/;
      const loadingPattern = /^loading$/;
      return (
        percentagePattern.test(val) ||
        bitsPattern.test(val) ||
        numberPattern.test(val) ||
        loadingPattern.test(val)
      );
    },
    {
      message:
        "Value must be a percentage (e.g., '34.53%' or '100%'), a measurement in bits (e.g., '40.25 bits'), or a plain number (e.g., '0.02' or '14.52').",
    },
  ),
  type: z.string(),
});

type CheckIfMetricIsInSelectMetric<T, U> = keyof T extends keyof U
  ? keyof U extends keyof T
    ? true
    : false
  : false;

export type MetricForEmitProgress = z.infer<typeof MetricForEmitProgressSchema>;

type MetricFromSelectMetric = Omit<
  SelectMetric,
  'id' | 'featureId' | 'timestamp'
> & {
  name: NonNullable<string>;
  type: NonNullable<string>;
  value: NonNullable<string>;
};
//Validation of same metric model
const AreTheSameMetricModel: CheckIfMetricIsInSelectMetric<
  MetricForEmitProgress,
  MetricFromSelectMetric
> = true;

export const EmitProgressDataSchema = z.object({
  useCases: z.array(UseCaseForEmitProgressSchema),
  metrics: z.array(MetricForEmitProgressSchema),
});

export type EmitProgressData = z.infer<typeof EmitProgressDataSchema>;

export const getLoadingMetrics = (): MetricForEmitProgress[] => [
  { name: 'Accuracy', value: 'loading', type: 'classification' },
  { name: 'Precision', value: 'loading', type: 'classification' },
  { name: 'Recall', value: 'loading', type: 'classification' },
  { name: 'F1-Score', value: 'loading', type: 'classification' },
  { name: 'ROC-AUC', value: 'loading', type: 'classification' },
  { name: 'Log Loss', value: 'loading', type: 'classification' },
  { name: 'Sentiment Accuracy', value: 'loading', type: 'sentiment' },
  { name: 'Response Consistency', value: 'loading', type: 'consistency' },
  { name: 'Perplexity', value: 'loading', type: 'text_quality' },
  { name: 'BLEU Score', value: 'loading', type: 'text_quality' },
  { name: 'Lexical Diversity', value: 'loading', type: 'text_quality' },
  { name: 'Response Precision', value: 'loading', type: 'relevance' },
  { name: 'Response Completeness', value: 'loading', type: 'relevance' },
];
