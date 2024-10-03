import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Feature } from '../../../../../shared/models/Feature.js';
import type { ProcessedCase, WorkerMessage } from '../types/WorkerTypes.js';
import type { InsertConfusionMatrix } from '../../../../../shared/models/ConfusionMatrix.js';
import { existsSync } from 'fs';

export class WorkerManager {
  private worker: Worker | null = null;
  private processedCases: ProcessedCase[] = [];
  private confusionMatrixResults: InsertConfusionMatrix[] = [];
  private debug: boolean;
  private emitProgress: (data: { stage: string; progress: number }) => void;

  constructor(
    debug: boolean,
    emitProgress: (data: { stage: string; progress: number }) => void,
  ) {
    this.debug = debug;
    this.emitProgress = emitProgress;
  }

  startWorker(googleApiKey: string, feature: Feature): void {
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

      console.log('workerPath ES: ', workerPath);

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
        } else if (message.type === 'CONFUSION_MATRIX') {
          this.confusionMatrixResults.push(
            ...(message.data as InsertConfusionMatrix[]),
          );
          const progress =
            (this.confusionMatrixResults.length / this.processedCases.length) *
            100;
          this.emitProgress({
            stage: 'Generando matrices de confusión',
            progress: Math.min(Math.round(progress * 100) / 100, 100),
          });
        }
      });
    }
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
