import type { Feature } from '../../../../../shared/models/Feature.js';
import type { ConfusionMatrixResult } from '../../../../../shared/models/ConfusionMatrix.js';

export interface MatrixGeneratorOptions {
  debug: boolean;
  emitProgress: ProgressCallback;
}

export interface MatrixGeneratorInterface {
  generateConfusionMatrix(feature: Feature): Promise<ConfusionMatrixResult>;
}

export type ProgressCallback = (data: {
  stage: string;
  progress: number;
}) => void;
