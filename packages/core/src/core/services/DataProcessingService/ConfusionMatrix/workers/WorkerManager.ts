import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Feature } from '../../../../../shared/models/Feature.js';
import type { ProcessedCase, WorkerMessage } from '../types/WorkerTypes.js';
import type { InsertConfusionMatrix } from '../../../../../shared/models/ConfusionMatrix.js';
import { existsSync } from 'fs';
import type { DataProcessingProgressCallback } from '../utils/DataProcessingCallback.js';
import {
  getLoadingMetrics,
  type UseCaseForEmitProgress,
} from '../types/DataProcessingTypes.js';

export class WorkerManager {
  private worker: Worker | null = null;
  private processedCases: ProcessedCase[] = [];
  private confusionMatrixResults: InsertConfusionMatrix[] = [];
  private debug: boolean;
  private emitProgress: DataProcessingProgressCallback;
  private useCases: UseCaseForEmitProgress[] = [];
  private totalUseCases: number = 0;
  private featureUseCases: Feature['useCases'] = [];

  constructor(debug: boolean, emitProgress: DataProcessingProgressCallback) {
    this.debug = debug;
    this.emitProgress = emitProgress;
  }

  startWorker(googleApiKey: string, feature: Feature, queueSize: number): void {
    if (Worker) {
      let workerPath: string;

      try {
        const currentFilePath = fileURLToPath(import.meta.url);
        const currentDir = path.dirname(currentFilePath);
        workerPath = path.resolve(currentDir, './MatrixWorker.js');

        if (!existsSync(workerPath)) {
          throw new Error(
            'El archivo del worker no existe en la ruta esperada',
          );
        }
      } catch (error) {
        console.error('Error al resolver la ruta del worker:', error);
        throw new Error('No se pudo determinar la ruta del worker');
      }

      this.totalUseCases = queueSize;
      this.featureUseCases = feature.useCases;

      this.worker = new Worker(workerPath, {
        workerData: {
          startTime: Date.now(),
          googleApiKey,
          feature,
          debug: this.debug,
        },
      });

      this.worker.on('message', (message: WorkerMessage) => {
        if (message.type === 'PROCESSED_CASES') {
          this.processedCases.push(...(message.data as ProcessedCase[]));
          this.updateUseCasesWithGeneratedResponses(
            message.data as ProcessedCase[],
          );
        } else if (message.type === 'CONFUSION_MATRIX') {
          const newMatrixResults = message.data as InsertConfusionMatrix[];
          this.confusionMatrixResults.push(...newMatrixResults);

          this.updateUseCasesWithConfusionMatrix(newMatrixResults);

          const progress =
            (this.confusionMatrixResults.length / this.totalUseCases) * 100;
          this.emitProgress({
            stage: 'Generating confusion matrix',
            progress: Math.min(Math.round(progress * 100) / 100, 100),
            useCasesToProcess: this.totalUseCases,
            data: {
              useCases: this.useCases,
              metrics: getLoadingMetrics(),
            },
          });
        }
      });
    }
  }

  private updateUseCasesWithGeneratedResponses(
    processedCases: ProcessedCase[],
  ): void {
    processedCases.forEach((pc) => {
      const featureUseCase = this.featureUseCases.find(
        (uc) => uc.id === pc.useCaseId,
      );
      const existingUseCase = this.useCases.find(
        (uc) => uc.id === pc.useCaseId,
      );
      if (existingUseCase) {
        existingUseCase.generatedResponse = pc.generatedResponse;
      } else if (featureUseCase) {
        this.useCases.push({
          id: pc.useCaseId,
          name: featureUseCase.name,
          description: featureUseCase.caseDescription,
          generatedResponse: pc.generatedResponse,
        });
      }
    });
  }

  private updateUseCasesWithConfusionMatrix(
    matrixResults: InsertConfusionMatrix[],
  ): void {
    matrixResults.forEach((matrixResult) => {
      const existingUseCase = this.useCases.find(
        (uc) => uc.id === matrixResult.useCaseId,
      );
      if (existingUseCase) {
        existingUseCase.confusionMatrix = {
          truePositives: matrixResult.truePositives,
          falsePositives: matrixResult.falsePositives,
          trueNegatives: matrixResult.trueNegatives,
          falseNegatives: matrixResult.falseNegatives,
        };
      }
    });
  }

  stopWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  postMessage(message: ProcessedCase): void {
    this.worker?.postMessage(message);
  }

  getProcessedCases(): ProcessedCase[] {
    return this.processedCases;
  }

  getConfusionMatrixResults(): InsertConfusionMatrix[] {
    return this.confusionMatrixResults;
  }
}
