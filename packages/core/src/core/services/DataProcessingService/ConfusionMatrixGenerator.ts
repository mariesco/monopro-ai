import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Feature } from '../../../shared/models/Feature.js';
import type {
  ConfusionMatrixResult,
  InsertConfusionMatrix,
} from '../../../shared/models/ConfusionMatrix.js';
import { Queue } from '../../../shared/utils/Queue.js';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';

type GoogleAIMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

interface WorkerMessage {
  type: 'PROCESSED_CASES' | 'CONFUSION_MATRIX';
  data: ProcessedCase[] | InsertConfusionMatrix[];
}

interface ProcessedCase {
  promptId: number;
  useCaseId: number;
  generatedResponse: string;
}

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
          google,
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

async function generatePartialConfusionMatrix(
  cases: ProcessedCase[],
  google: ReturnType<typeof createGoogleGenerativeAI>,
  feature: Feature,
  log: (...args: any[]) => void,
): Promise<InsertConfusionMatrix[]> {
  const confusionMatrixSchema = z.array(
    z.object({
      promptId: z.number(),
      useCaseId: z.number(),
      truePositives: z.number(),
      falsePositives: z.number(),
      trueNegatives: z.number(),
      falseNegatives: z.number(),
      featureId: z.number(),
    }),
  );

  const systemMessage = `Eres un asistente especializado en generar matrices de confusión basadas en respuestas generadas y casos de uso. Analiza las respuestas generadas para la característica "${feature.description}" y genera una matriz de confusión para cada combinación de prompt y caso de uso. La matriz debe incluir truePositives, falsePositives, trueNegatives, y falseNegatives. Asegúrate de incluir el promptId, useCaseId y featureId en cada elemento de la matriz.`;

  const promptsMap = new Map<number, string>();
  cases.forEach((c) => {
    if (!promptsMap.has(c.promptId)) {
      const prompt = feature.prompts.find((p) => p.id === c.promptId);
      if (prompt) {
        promptsMap.set(c.promptId, prompt.content);
      }
    }
  });

  const messages: GoogleAIMessage[] = [
    { role: 'system', content: systemMessage },
    ...Array.from(promptsMap.entries()).map(
      ([promptId, content]): GoogleAIMessage => ({
        role: 'user',
        content: `Prompt ID ${promptId}: ${content}`,
      }),
    ),
  ];

  const userMessages = cases.map((c) => {
    const useCase = feature.useCases.find((uc) => uc.id === c.useCaseId);
    const expectedResponseClass = feature.responseClasses.find(
      (rc) => rc.id === useCase?.responseClassExpectedId,
    );

    return `Caso de uso ID ${c.useCaseId} (Prompt ID ${c.promptId}):
Descripción: ${useCase?.caseDescription}
Clase de respuesta esperada: ${expectedResponseClass?.description}
Respuesta generada: ${c.generatedResponse}`;
  });

  messages.push({ role: 'user', content: userMessages.join('\n\n') });

  log(`Generando matriz de confusión para ${cases.length} casos`);
  log('Mensajes:', JSON.stringify(messages, null, 2));

  log('Enviando solicitud a Google Gemini...');
  const { object: partialConfusionMatrix } = await generateObject({
    model: google('gemini-1.5-flash-latest'),
    schema: confusionMatrixSchema,
    messages,
    temperature: 0.0,
  });
  log('Respuesta recibida de Google Gemini');
  log(
    `Matriz de confusión generada con ${partialConfusionMatrix.length} elementos`,
  );
  log('Matriz de confusión:', JSON.stringify(partialConfusionMatrix, null, 2));

  return partialConfusionMatrix;
}

type ProgressCallback = (data: { stage: string; progress: number }) => void;

export class ConfusionMatrixGenerator {
  private useCaseQueue: Queue<{
    promptId: number;
    useCaseId: number;
    promptContent: string;
    caseDescription: string;
  }>;
  private startTime: number;
  private worker: Worker | null;
  private processedUseCases: ProcessedCase[];
  private confusionMatrixResults: InsertConfusionMatrix[];
  private lastLoggedCount: number;
  private debug: boolean;
  private emitProgress: ProgressCallback;

  constructor(
    debug: boolean = false,
    emitProgress: ProgressCallback = () => {},
  ) {
    this.useCaseQueue = new Queue();
    this.startTime = 0;
    this.worker = null;
    this.processedUseCases = [];
    this.confusionMatrixResults = [];
    this.lastLoggedCount = 0;
    this.debug = debug;
    this.emitProgress = emitProgress;
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log(...args);
    }
  }

  async generateConfusionMatrix(
    feature: Feature,
  ): Promise<ConfusionMatrixResult> {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const groq = createOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.log(
      '---Iniciando generación de respuestas para la característica:',
      feature.description,
    );
    this.log('---Número total de casos de uso:', feature.useCases.length);

    this.startTime = Date.now();
    this.initializeQueue(feature);
    this.startWorker(process.env.GOOGLE_API_KEY!, feature);

    const queueSize = this.useCaseQueue.size();
    this.log(
      '---Cola inicializada. Número de casos de uso en cola:',
      queueSize,
    );

    const estimatedTimeInSeconds = queueSize * 7;
    const estimatedTimeInMinutes = Math.ceil(estimatedTimeInSeconds / 60);
    this.log(
      `---Tiempo estimado de procesamiento: aproximadamente ${estimatedTimeInMinutes} minutos`,
    );

    await this.processQueue(groq);
    this.log(
      '---Procesamiento de cola completado. Respuestas generadas:',
      this.processedUseCases.length,
    );

    // Esperar 10 segundos adicionales para asegurar que el worker procese los últimos casos
    await new Promise((resolve) => setTimeout(resolve, 10000));

    this.stopWorker();

    this.log(
      '---Matriz de confusión generada. Número de elementos:',
      this.confusionMatrixResults.length,
    );

    const confusionMatrixResult: ConfusionMatrixResult = {
      confusionMatrix: this.confusionMatrixResults,
      generatedTexts: this.processedUseCases.map((uc) => ({
        id: `${uc.promptId}-${uc.useCaseId}`,
        text: uc.generatedResponse,
      })),
      expectedTexts: feature.useCases.map((uc) => ({
        id: `${uc.id}`,
        text:
          feature.responseClasses.find(
            (rc) => rc.id === uc.responseClassExpectedId,
          )?.description || '',
      })),
    };

    this.log('---Proceso completado. Resultado final generado.');
    return confusionMatrixResult;
  }

  private initializeQueue(feature: Feature): void {
    let count = 0;
    feature.prompts.forEach((prompt) => {
      const relatedUseCases = feature.useCases.filter(
        (useCase) => useCase.promptId === prompt.id,
      );
      relatedUseCases.forEach((useCase) => {
        if (count < 15) {
          // TODO: Remove limit
          this.useCaseQueue.enqueue({
            promptId: prompt.id,
            useCaseId: useCase.id,
            promptContent: prompt.content,
            caseDescription: useCase.caseDescription,
          });
          count++;
        }
      });
    });
    this.log(`---Cola inicializada con ${count} casos de uso.`);
  }

  private startWorker(googleApiKey: string, feature: Feature): void {
    if (isMainThread) {
      const workerPath = fileURLToPath(import.meta.url);
      this.worker = new Worker(workerPath, {
        workerData: {
          startTime: this.startTime,
          googleApiKey,
          feature,
          debug: this.debug,
        },
      });

      this.worker.on('message', (message: WorkerMessage) => {
        if (message.type === 'PROCESSED_CASES') {
          this.processedUseCases.push(...(message.data as ProcessedCase[]));
          this.logNewProcessedUseCases();
        } else if (message.type === 'CONFUSION_MATRIX') {
          this.confusionMatrixResults.push(
            ...(message.data as InsertConfusionMatrix[]),
          );
          const progress =
            (this.confusionMatrixResults.length /
              this.processedUseCases.length) *
            100;
          this.emitProgress({
            stage: 'Generando matrices de confusión',
            progress: Math.min(Math.round(progress * 100) / 100, 100),
          });
        }
      });
    }
  }

  private stopWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private async processQueue(
    openai: ReturnType<typeof createOpenAI>,
  ): Promise<void> {
    const generatedResponseSchema = z.object({
      success: z.boolean(),
      value: z.object({
        promptId: z.number(),
        useCaseId: z.number(),
        generatedResponse: z.string(),
      }),
    });

    const totalCases = this.useCaseQueue.size();
    let processedCount = 0;

    while (!this.useCaseQueue.isEmpty()) {
      const useCase = this.useCaseQueue.dequeue();
      if (!useCase) continue;

      this.log(
        `---Procesando caso de uso ${processedCount + 1}: Prompt ID ${useCase.promptId}, Use Case ID ${useCase.useCaseId}`,
      );

      const result = await this.generateResponseWithRetry(
        openai,
        useCase,
        generatedResponseSchema,
        processedCount,
      );

      if (result.success) {
        this.worker?.postMessage(result.value);
        this.log(
          `---Respuesta generada exitosamente para el caso de uso ${processedCount + 1}`,
        );
        processedCount++;
        const progress = (processedCount / totalCases) * 100;
        this.emitProgress({
          stage: 'Procesando casos de uso',
          progress: Math.min(Math.round(progress * 100) / 100, 100),
        });
      } else {
        console.error(
          `Falló la generación de respuesta para el caso de uso ${processedCount + 1}.`,
        );
      }
    }

    this.log(
      `---Procesamiento de cola completado. Total de casos procesados: ${processedCount}`,
    );
  }

  private async generateResponseWithRetry(
    openai: ReturnType<typeof createOpenAI>,
    useCase: {
      promptId: number;
      useCaseId: number;
      promptContent: string;
      caseDescription: string;
    },
    schema: z.ZodType<{
      success: boolean;
      value: { promptId: number; useCaseId: number; generatedResponse: string };
    }>,
    attemptCount: number,
    maxRetries: number = 2,
    delay: number = 5000,
  ): Promise<z.infer<typeof schema>> {
    const prompt = this.buildSingleResponseGenerationPrompt(useCase);
    const startTime = Date.now();

    try {
      const { object: generatedResponse } = await Promise.race([
        generateObject({
          model: openai('llama-3.1-70b-versatile'),
          schema: schema,
          prompt: prompt,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 7000),
        ),
      ]);

      const elapsedTime = Date.now() - startTime;
      this.log(
        `---Tiempo de procesamiento para el caso de uso ${attemptCount + 1}: ${elapsedTime}ms`,
      );

      return generatedResponse;
    } catch (error) {
      if (maxRetries > 0) {
        this.log(
          `---Intento fallido para el caso de uso ${attemptCount + 1}. Esperando ${delay / 1000} segundos antes de reintentar...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.generateResponseWithRetry(
          openai,
          useCase,
          schema,
          attemptCount,
          maxRetries - 1,
          delay,
        );
      } else {
        console.error(
          `Error generando respuesta para el caso de uso ${attemptCount + 1} después de todos los reintentos: ${error}`,
        );
        return {
          success: false,
          value: {
            promptId: useCase.promptId,
            useCaseId: useCase.useCaseId,
            generatedResponse: '',
          },
        };
      }
    }
  }

  private buildSingleResponseGenerationPrompt(useCase: {
    promptId: number;
    useCaseId: number;
    promptContent: string;
    caseDescription: string;
  }): string {
    return `Genera una respuesta para el siguiente caso de uso utilizando el prompt proporcionado:

Prompt ID ${useCase.promptId}: ${useCase.promptContent}

Caso de uso ID ${useCase.useCaseId}: ${useCase.caseDescription}

Genera una respuesta para este caso de uso. Formato: Devuelve el resultado como un objeto JSON con la siguiente estructura:
{
  success: boolean,
  value: {
    promptId: number,
    useCaseId: number,
    generatedResponse: string
  }
}`;
  }

  private logNewProcessedUseCases(): void {
    const newProcessedCount =
      this.processedUseCases.length - this.lastLoggedCount;
    if (newProcessedCount > 0) {
      const newProcessedUseCases = this.processedUseCases.slice(
        this.lastLoggedCount,
      );
      this.log(`Nuevos casos de uso procesados: ${newProcessedCount}`);
      this.log(
        'IDs de nuevos casos procesados:',
        newProcessedUseCases
          .map((uc) => `${uc.promptId}-${uc.useCaseId}`)
          .join(', '),
      );
      this.lastLoggedCount = this.processedUseCases.length;
    }
  }
}
