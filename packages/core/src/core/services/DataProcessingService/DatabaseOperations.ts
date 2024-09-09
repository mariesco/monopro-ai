import { getDB } from '../../../shared/utils/Database.js';
import {
  ConfusionMatrixTable,
  MetricsTable,
} from '../../../shared/models/drizzle_schema.js';
import type {
  InsertConfusionMatrix,
  SelectConfusionMatrix,
} from '../../../shared/models/ConfusionMatrix.js';
import type { InsertMetric } from '../../../shared/models/Metrics.js';

export class DatabaseOperations {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    this.db = getDB(NEON_URL);
  }

  async saveConfusionMatrix(
    confusionMatrix: InsertConfusionMatrix[],
  ): Promise<SelectConfusionMatrix[]> {
    const result = await this.db
      .insert(ConfusionMatrixTable)
      .values(confusionMatrix)
      .returning();
    return result;
  }

  async saveMetrics(featureId: number, metrics: InsertMetric[]): Promise<void> {
    const metricsWithFeatureId = metrics.map((metric) => ({
      ...metric,
      featureId,
    }));
    await this.db.insert(MetricsTable).values(metricsWithFeatureId);
  }
}
