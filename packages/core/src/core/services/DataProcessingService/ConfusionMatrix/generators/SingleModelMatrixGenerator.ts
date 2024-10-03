import { BaseMatrixGenerator } from './BaseMatrixGenerator.js';
import type { Feature } from '../../../../../shared/models/Feature.js';
import type { MatrixGeneratorOptions } from '../types/MatrixTypes.js';
import { WorkerManager } from '../workers/WorkerManager.js';
import { QueueManager } from '../queues/QueueManager.js';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type { ConfusionMatrixResult } from '../../../../../shared/models/ConfusionMatrix.js';
import { generateObject } from 'ai';
import { buildSingleResponseGenerationPrompt } from '../utils/buildPromptUtils.js';

export class SingleModelMatrixGenerator extends BaseMatrixGenerator {
  private workerManager: WorkerManager;
  private queueManager: QueueManager;

  constructor(options: MatrixGeneratorOptions) {
    super(options);
    this.workerManager = new WorkerManager(this.debug, this.emitProgress);
    this.queueManager = new QueueManager();
  }

  async generateConfusionMatrix(
    feature: Feature,
  ): Promise<ConfusionMatrixResult> {
    this.log(
      '---Iniciando generación de respuestas para la característica:',
      feature.description,
    );
    this.log('---Número total de casos de uso:', feature.useCases.length);

    const startTime = Date.now();
    this.queueManager.initializeQueue(feature);
    this.workerManager.startWorker(process.env.GOOGLE_API_KEY!, feature);

    const queueSize = this.queueManager.size();
    this.log(
      '---Cola inicializada. Número de casos de uso en cola:',
      queueSize,
    );

    const estimatedTimeInSeconds = queueSize * 7;
    const estimatedTimeInMinutes = Math.ceil(estimatedTimeInSeconds / 60);
    this.log(
      `---Tiempo estimado de procesamiento: aproximadamente ${estimatedTimeInMinutes} minutos`,
    );

    await this.processQueue(
      //createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      createOpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }),
    );
    this.log(
      '---Procesamiento de cola completado. Respuestas generadas:',
      this.workerManager.getProcessedCases().length,
    );

    // Esperar 10 segundos adicionales para asegurar que el worker procese los últimos casos
    await new Promise((resolve) => setTimeout(resolve, 10000));

    this.workerManager.stopWorker();

    this.log(
      '---Matriz de confusión generada. Número de elementos:',
      this.workerManager.getConfusionMatrixResults().length,
    );

    return {
      confusionMatrix: this.workerManager.getConfusionMatrixResults(),
      generatedTexts: this.workerManager.getProcessedCases().map((uc) => ({
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

    const totalCases = this.queueManager.size();
    let processedCount = 0;

    while (!this.queueManager.isEmpty()) {
      const useCase = this.queueManager.dequeue();
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
        this.workerManager.postMessage(result.value);
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
    const prompt = buildSingleResponseGenerationPrompt(useCase);
    const startTime = Date.now();

    try {
      const { object: generatedResponse } = await Promise.race([
        generateObject({
          model: openai('llama-3.1-70b-versatile'),
          //model: openai('gpt-4o-mini'),
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
}
