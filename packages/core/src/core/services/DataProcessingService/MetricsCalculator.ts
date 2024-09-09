import type { SelectConfusionMatrix } from '../../../shared/models/ConfusionMatrix.js';
import type { InsertMetric } from '../../../shared/models/Metrics.js';

export class MetricsCalculator {
  async calculateMetrics(
    confusionMatrix: SelectConfusionMatrix[],
  ): Promise<InsertMetric[]> {
    const metrics: InsertMetric[] = [];

    for (const entry of confusionMatrix) {
      const { truePositives, falsePositives, trueNegatives, falseNegatives } =
        entry;
      const total =
        truePositives + falsePositives + trueNegatives + falseNegatives;

      // Accuracy
      const accuracy = (truePositives + trueNegatives) / total;
      metrics.push({
        featureId: entry.promptId,
        name: 'Accuracy',
        value: accuracy.toString(),
        type: 'classification',
      });

      // Precision
      const precision = truePositives / (truePositives + falsePositives);
      metrics.push({
        featureId: entry.promptId,
        name: 'Precision',
        value: precision.toString(),
        type: 'classification',
      });

      // Recall
      const recall = truePositives / (truePositives + falseNegatives);
      metrics.push({
        featureId: entry.promptId,
        name: 'Recall',
        value: recall.toString(),
        type: 'classification',
      });

      // F1 Score
      const f1Score = (2 * (precision * recall)) / (precision + recall);
      metrics.push({
        featureId: entry.promptId,
        name: 'F1 Score',
        value: f1Score.toString(),
        type: 'classification',
      });

      // Specificity
      const specificity = trueNegatives / (trueNegatives + falsePositives);
      metrics.push({
        featureId: entry.promptId,
        name: 'Specificity',
        value: specificity.toString(),
        type: 'classification',
      });
    }

    return metrics;
  }
}
