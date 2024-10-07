import type { Feature } from '../../../../../shared/models/Feature.js';
import type { ConfusionMatrixResult } from '../../../../../shared/models/ConfusionMatrix.js';
import type { DataProcessingProgressCallback } from '../utils/DataProcessingCallback.js';

export interface MatrixGeneratorOptions {
  debug: boolean;
  emitProgress: DataProcessingProgressCallback;
}

export interface MatrixGeneratorInterface {
  generateConfusionMatrix(feature: Feature): Promise<ConfusionMatrixResult>;
}
