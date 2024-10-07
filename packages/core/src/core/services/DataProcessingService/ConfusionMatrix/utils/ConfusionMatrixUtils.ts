import { z } from 'zod';
import type { Feature } from '../../../../../shared/models/Feature.js';
import type { InsertConfusionMatrix } from '../../../../../shared/models/ConfusionMatrix.js';
import type { ProcessedCase } from '../types/WorkerTypes.js';
import type { AIModelInterface } from '../models/AIModelInterface.js';

export async function generatePartialConfusionMatrix(
  cases: ProcessedCase[],
  aiModel: AIModelInterface,
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

  const systemMessage = `Eres un asistente especializado en generar matrices de confusión basadas en respuestas generadas y casos de uso. Analiza las respuestas generadas para la característica "${feature.description}" y genera una matriz de confusión para cada combinación de prompt y caso de uso. La matriz debe incluir truePositives, falsePositives, trueNegatives, y falseNegatives. Es crucial que para cada matriz, exactamente un valor sea 1 y los otros tres sean 0. Asegúrate de incluir el promptId, useCaseId y featureId en cada elemento de la matriz.`;

  const promptsMap = new Map<number, string>();
  cases.forEach((c) => {
    if (!promptsMap.has(c.promptId)) {
      const prompt = feature.prompts.find((p) => p.id === c.promptId);
      if (prompt) {
        promptsMap.set(c.promptId, prompt.content);
      }
    }
  });

  const messages: Array<{
    role: 'user' | 'system' | 'assistant';
    content: string;
  }> = [
    { role: 'system', content: systemMessage },
    ...Array.from(promptsMap.entries()).map(([promptId, content]) => ({
      role: 'user' as const,
      content: `Prompt ID ${promptId}: ${content}`,
    })),
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

  messages.push({
    role: 'user',
    content:
      userMessages.join('\n\n') +
      '\n\nRecuerda: En cada matriz de confusión, SOLO UN valor debe ser 1 y los otros tres DEBEN ser 0.',
  });

  log(`Generando matriz de confusión para ${cases.length} casos`);
  log('Mensajes:', JSON.stringify(messages, null, 2));

  log('Enviando solicitud al modelo de IA...');
  const { object: partialConfusionMatrix } = await aiModel.generateObject<
    InsertConfusionMatrix[]
  >({
    schema: confusionMatrixSchema,
    messages,
    temperature: 0.0,
  });
  log('Respuesta recibida del modelo de IA');
  log(
    `Matriz de confusión generada con ${partialConfusionMatrix.length} elementos`,
  );
  return partialConfusionMatrix;
}
