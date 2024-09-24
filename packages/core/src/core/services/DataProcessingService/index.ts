import { FeatureDataLoader } from './FeatureDataLoader.js';
import { ConfusionMatrixGenerator } from './ConfusionMatrixGenerator.js';
import { DatabaseOperations } from './DatabaseOperations.js';
import { MetricsCalculator } from './MetricsCalculator.js';
import type { ConfusionMatrixResult } from '../../../shared/models/ConfusionMatrix.js';

type ProgressCallback = (data: { stage: string; progress: number }) => void;

export class DataProcessingService {
  private featureDataLoader: FeatureDataLoader;
  private confusionMatrixGenerator: ConfusionMatrixGenerator;
  private databaseOperations: DatabaseOperations;
  private metricsCalculator: MetricsCalculator;

  constructor(NEON_URL: string) {
    if (!NEON_URL) {
      throw new Error('NEON_URL is not defined.');
    }
    this.featureDataLoader = new FeatureDataLoader(NEON_URL);
    this.confusionMatrixGenerator = new ConfusionMatrixGenerator();
    this.databaseOperations = new DatabaseOperations(NEON_URL);
    this.metricsCalculator = new MetricsCalculator();
  }

  async processFeature(featureId: number, progressCallback?: ProgressCallback) {
    const emitProgress = (stage: string, progress: number) => {
      if (progressCallback) {
        progressCallback({ stage, progress });
      }
    };

    emitProgress('starting the calculation', 0);

    const feature = await this.featureDataLoader.getFeatureData(featureId);
    emitProgress(
      'Feature data loaded, starting confusion matrix generation',
      20,
    );

    const confusionMatrixResult: ConfusionMatrixResult =
      await this.confusionMatrixGenerator.generateConfusionMatrix(feature);
    emitProgress('Confusion matrix generated, saving to database', 60);

    const savedConfusionMatrix =
      await this.databaseOperations.saveConfusionMatrix(
        confusionMatrixResult.confusionMatrix,
      );
    emitProgress('Confusion matrix saved, calculating metrics', 70);

    if (
      !confusionMatrixResult.generatedTexts ||
      !confusionMatrixResult.expectedTexts
    ) {
      throw new Error('GeneratedTexts or ExpectedTexts are undefined.');
    }

    const metrics = await this.metricsCalculator.calculateMetrics({
      confusionMatrix: savedConfusionMatrix,
      generatedTexts: confusionMatrixResult.generatedTexts,
      expectedTexts: confusionMatrixResult.expectedTexts,
    });
    emitProgress('Metrics calculated, saving to database', 90);

    console.log('Metrics Result:', metrics);

    await this.databaseOperations.saveMetrics(featureId, metrics);
    emitProgress('Calculation complete', 100);

    return { confusionMatrix: savedConfusionMatrix, metrics };
  }

  async getModelInfo(featureId: number) {
    // TODO: Implement this method
    return {
      /* modelInfo */
    };
  }

  async getUserFeedback(featureId: number) {
    // TODO: Implement this method
    return {
      /* userFeedback */
    };
  }

  async getRegressionData(featureId: number) {
    // TODO: Implement this method
    return {
      /* regressionData */
    };
  }

  async getMetrics({ featureId }: { featureId: number }) {
    const metrics = await this.databaseOperations.getMetrics(featureId);
    return metrics.reduce(
      (acc, metric) => {
        if (metric.type && metric.name && metric.value) {
          if (!acc[metric.type]) {
            acc[metric.type] = [];
          }
          acc[metric.type]!.push({
            name: metric.name,
            value: metric.value,
          });
        }
        return acc;
      },
      {} as Record<string, { name: string; value: string }[]>,
    );
  }

  async getMetricsWithTimestamp({
    featureId,
  }: {
    featureId: number;
  }): Promise<{ metrics: Record<string, any[]>; lastUpdated: Date }> {
    const metrics = await this.databaseOperations.getMetrics(featureId);
    const lastUpdated =
      await this.databaseOperations.getLastMetricTimestamp(featureId);

    const groupedMetrics = metrics.reduce(
      (acc, metric) => {
        if (metric.type && metric.name && metric.value) {
          if (!acc[metric.type]) {
            acc[metric.type] = [];
          }
          acc[metric.type]!.push({
            name: metric.name,
            value: metric.value,
          });
        }
        return acc;
      },
      {} as Record<string, { name: string; value: string }[]>,
    );

    return { metrics: groupedMetrics, lastUpdated };
  }
}
