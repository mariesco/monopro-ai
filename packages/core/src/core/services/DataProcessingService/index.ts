import { FeatureDataLoader } from './FeatureDataLoader.js';
import { ConfusionMatrixGenerator } from './ConfusionMatrixGenerator.js';
import { DatabaseOperations } from './DatabaseOperations.js';
import { MetricsCalculator } from './MetricsCalculator.js';

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

    emitProgress('start', 0);

    const feature = await this.featureDataLoader.getFeatureData(featureId);
    emitProgress('featureDataLoaded', 20);

    const confusionMatrix =
      await this.confusionMatrixGenerator.generateConfusionMatrix(feature);
    emitProgress('confusionMatrixGenerated', 60);

    const savedConfusionMatrix =
      await this.databaseOperations.saveConfusionMatrix(confusionMatrix);
    emitProgress('confusionMatrixSaved', 70);

    const metrics =
      await this.metricsCalculator.calculateMetrics(savedConfusionMatrix);
    emitProgress('metricsCalculated', 90);

    await this.databaseOperations.saveMetrics(featureId, metrics);
    emitProgress('complete', 100);

    return { confusionMatrix, metrics };
  }
}
