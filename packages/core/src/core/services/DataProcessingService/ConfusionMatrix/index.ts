import type { ConfusionMatrixResult } from '../../../../shared/models/ConfusionMatrix.js';
import type { Feature } from '../../../../shared/models/Feature.js';
import { SingleModelMatrixGenerator } from './generators/SingleModelMatrixGenerator.js';

export class ConfusionMatrixGenerator {
  private generator: SingleModelMatrixGenerator;

  constructor(
    debug: boolean = false,
    emitProgress: (data: {
      stage: string;
      progress: number;
    }) => void = () => {},
  ) {
    this.generator = new SingleModelMatrixGenerator({ debug, emitProgress });
  }

  async generateConfusionMatrix(
    feature: Feature,
  ): Promise<ConfusionMatrixResult> {
    return this.generator.generateConfusionMatrix(feature);
  }
}
