import { FeatureDataLoader } from './FeatureDataLoader.js';
import { ConfusionMatrixGenerator } from './ConfusionMatrix/index.js';
import { DatabaseOperations } from './DatabaseOperations.js';
import { MetricsCalculator } from './MetricsCalculator.js';
import type { ConfusionMatrixResult } from '../../../shared/models/ConfusionMatrix.js';
import type { DataProcessingProgressCallback } from './ConfusionMatrix/utils/DataProcessingCallback.js';
import {
  getLoadingMetrics,
  type MetricForEmitProgress,
  type UseCaseForEmitProgress,
} from './ConfusionMatrix/types/DataProcessingTypes.js';

export class DataProcessingService {
  private featureDataLoader: FeatureDataLoader;
  private confusionMatrixGenerator: ConfusionMatrixGenerator;
  private databaseOperations: DatabaseOperations;
  private metricsCalculator: MetricsCalculator;

  constructor(NEON_URL: string) {
    this.validateEnvVariables();

    this.featureDataLoader = new FeatureDataLoader(NEON_URL);
    this.databaseOperations = new DatabaseOperations(NEON_URL);
    this.metricsCalculator = new MetricsCalculator();
    this.confusionMatrixGenerator = new ConfusionMatrixGenerator(); // Inicialización por defecto
  }

  private validateEnvVariables() {
    const requiredVars = [
      'NEON_URL',
      'GOOGLE_API_KEY',
      'OPENAI_API_KEY',
      'GROQ_API_KEY',
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`,
      );
    }
  }

  async processFeature(
    featureId: number,
    progressCallback?: DataProcessingProgressCallback,
    debug: boolean = false,
  ) {
    let processedUseCases: UseCaseForEmitProgress[] = [];

    const emitProgress: DataProcessingProgressCallback = (data) => {
      if (progressCallback) {
        progressCallback(data);
      }
    };

    emitProgress({
      stage: 'starting the calculation',
      progress: 0,
      useCasesToProcess: 0,
      data: {
        useCases: [],
        metrics: getLoadingMetrics(),
      },
    });

    const feature = await this.featureDataLoader.getFeatureData(featureId);
    emitProgress({
      stage: 'Feature data loaded, starting confusion matrix generation',
      progress: 20,
      useCasesToProcess: feature.useCases.length,
      data: {
        useCases: [],
        metrics: getLoadingMetrics(),
      },
    });

    this.confusionMatrixGenerator = new ConfusionMatrixGenerator(
      debug,
      (data) => {
        processedUseCases = data.data.useCases;
        emitProgress(data);
      },
    );
    const confusionMatrixResult: ConfusionMatrixResult =
      await this.confusionMatrixGenerator.generateConfusionMatrix(feature);
    emitProgress({
      stage: 'Confusion matrix generated, saving to database',
      progress: 60,
      useCasesToProcess: processedUseCases.length,
      data: {
        useCases: processedUseCases,
        metrics: getLoadingMetrics(),
      },
    });

    const savedConfusionMatrix =
      await this.databaseOperations.saveConfusionMatrix(
        confusionMatrixResult.confusionMatrix,
      );
    emitProgress({
      stage: 'Confusion matrix saved, calculating metrics',
      progress: 70,
      useCasesToProcess: processedUseCases.length,
      data: {
        useCases: processedUseCases,
        metrics: getLoadingMetrics(),
      },
    });

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
    const metricsForEmitProgress: MetricForEmitProgress[] = metrics.map(
      (metric) => ({
        name: metric.name!,
        value: metric.value!,
        type: metric.type!,
      }),
    );

    emitProgress({
      stage: 'Metrics calculated, saving to database',
      progress: 90,
      useCasesToProcess: processedUseCases.length,
      data: {
        useCases: processedUseCases,
        metrics: metricsForEmitProgress,
      },
    });

    console.log('Metrics Result:', metrics);

    await this.databaseOperations.saveMetrics(featureId, metrics);
    emitProgress({
      stage: 'Calculation complete',
      progress: 100,
      useCasesToProcess: processedUseCases.length,
      data: {
        useCases: processedUseCases,
        metrics: metricsForEmitProgress,
      },
    });

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
