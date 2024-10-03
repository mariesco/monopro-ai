import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { Feature } from '../../../../../shared/models/Feature.js';
import type { ProcessedCase, WorkerMessage } from '../types/WorkerTypes.js';
import { Queue } from '../../../../../shared/utils/Queue.js';
import { generatePartialConfusionMatrix } from '../utils/ConfusionMatrixUtils.js';
import type { AIModelInterface } from '../models/AIModelInterface.js';
import { generateObject } from 'ai';

if (!isMainThread) {
  const { startTime, feature, googleApiKey, debug } = workerData;

  function log(...args: any[]): void {
    if (debug) {
      console.log(...args);
    }
  }

  let processedCases: ProcessedCase[] = [];
  let lastProcessedTime = Date.now();
  const matrixGenerationQueue = new Queue<ProcessedCase[]>();

  const google = createGoogleGenerativeAI({
    apiKey: googleApiKey,
  });

  const aiModel: AIModelInterface = {
    generateObject: async (params) => {
      const model = google('gemini-1.5-flash-latest');
      return generateObject({ ...params, model: model });
    },
  };

  setInterval(async () => {
    const currentTime = Date.now();
    if (processedCases.length > 0 && currentTime - lastProcessedTime >= 5000) {
      const casesToProcess = [...processedCases];
      processedCases = [];
      lastProcessedTime = currentTime;
      matrixGenerationQueue.enqueue(casesToProcess);
    }
  }, 1000);

  async function processMatrixGenerationQueue() {
    while (!matrixGenerationQueue.isEmpty()) {
      const casesToProcess = matrixGenerationQueue.dequeue();
      if (casesToProcess) {
        log(
          `---WORKER: Procesando ${casesToProcess.length} casos para generar matriz de confusión`,
        );
        log(
          '---WORKER: Casos a procesar:',
          JSON.stringify(casesToProcess, null, 2),
        );
        const confusionMatrix = await generatePartialConfusionMatrix(
          casesToProcess,
          aiModel,
          feature,
          log,
        );
        log(
          `---WORKER: Matriz de confusión generada con ${confusionMatrix.length} elementos`,
        );
        log(
          '---WORKER: Matriz de confusión:',
          JSON.stringify(confusionMatrix, null, 2),
        );

        parentPort?.postMessage({
          type: 'CONFUSION_MATRIX',
          data: confusionMatrix,
        } as WorkerMessage);
      }
    }
    setTimeout(processMatrixGenerationQueue, 1000);
  }

  processMatrixGenerationQueue();

  parentPort?.on('message', (message: ProcessedCase) => {
    processedCases.push(message);
    parentPort?.postMessage({
      type: 'PROCESSED_CASES',
      data: [message],
    } as WorkerMessage);
  });
}
