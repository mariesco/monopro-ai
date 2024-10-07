import type { ConfusionMatrixResult } from '../../../../../shared/models/ConfusionMatrix.js';
import type { Feature } from '../../../../../shared/models/Feature.js';
import type { DataProcessingProgressCallback } from '../utils/DataProcessingCallback.js';
import type {
  MatrixGeneratorOptions,
  MatrixGeneratorInterface,
} from '../types/MatrixTypes.js';

export abstract class BaseMatrixGenerator implements MatrixGeneratorInterface {
  protected debug: boolean;
  protected emitProgress: DataProcessingProgressCallback;

  constructor(options: MatrixGeneratorOptions) {
    this.debug = options.debug;
    this.emitProgress = options.emitProgress;
  }

  abstract generateConfusionMatrix(
    feature: Feature,
  ): Promise<ConfusionMatrixResult>;

  protected log(...args: any[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }
}
