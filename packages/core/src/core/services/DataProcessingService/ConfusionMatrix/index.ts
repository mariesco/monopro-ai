import type { ConfusionMatrixResult } from '../../../../shared/models/ConfusionMatrix.js';
import type { Feature } from '../../../../shared/models/Feature.js';
import type { DataProcessingProgressCallback } from './utils/DataProcessingCallback.js';
import { SingleModelMatrixGenerator } from './generators/SingleModelMatrixGenerator.js';

export class ConfusionMatrixGenerator {
  private generator: SingleModelMatrixGenerator;

  constructor(
    debug: boolean = false,
    emitProgress: DataProcessingProgressCallback = () => {},
  ) {
    this.generator = new SingleModelMatrixGenerator({ debug, emitProgress });
  }

  async generateConfusionMatrix(
    feature: Feature,
  ): Promise<ConfusionMatrixResult> {
    return this.generator.generateConfusionMatrix(feature);
  }
}
