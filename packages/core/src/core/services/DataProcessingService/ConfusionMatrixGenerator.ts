import { z } from 'zod';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Feature } from '../../../shared/models/Feature.js';
import type { InsertConfusionMatrix } from '../../../shared/models/ConfusionMatrix.js';

export class ConfusionMatrixGenerator {
  async generateConfusionMatrix(
    feature: Feature,
  ): Promise<InsertConfusionMatrix[]> {
    const groq = createOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const { text: generatedResponses } = await generateText({
      model: groq('llama3-groq-70b-8192-tool-use-preview'),
      prompt: this.buildResponseGenerationPrompt(feature),
    });
    const generatedResponsesSchema = z.array(
      z.object({
        promptId: z.number(),
        useCaseId: z.number(),
        generatedResponse: z.string(),
      }),
    );
    const generatedResponsesArray = generatedResponsesSchema.parse(
      JSON.parse(generatedResponses),
    );

    const { text: confusionMatrix } = await generateText({
      model: groq('llama3-groq-70b-8192-tool-use-preview'),
      prompt: this.buildConfusionMatrixPrompt(feature, generatedResponsesArray),
    });

    const confusionMatrixSchema = z.array(
      z.object({
        promptId: z.number(),
        useCaseId: z.number(),
        truePositives: z.number(),
        falsePositives: z.number(),
        trueNegatives: z.number(),
        falseNegatives: z.number(),
      }),
    );

    const parsedConfusionMatrix = confusionMatrixSchema.parse(
      JSON.parse(confusionMatrix),
    );

    return parsedConfusionMatrix;
  }

  private buildResponseGenerationPrompt(feature: Feature): string {
    let promptForLLM = `Genera un array de respuestas para cada uno de los siguientes casos de uso de la característica "${feature.description}":\n\n`;

    feature.prompts.forEach((prompt) => {
      promptForLLM += `Prompt ${prompt.id}: ${prompt.content}\n\n`;
      feature.useCases.forEach((useCase) => {
        promptForLLM += `Caso de uso ${useCase.id}: ${useCase.caseDescription}\n\n`;
      });
    });

    promptForLLM += `Genera una respuesta para cada caso de uso utilizando el prompt correspondiente. Devuelve los resultados como un array de objetos JSON con la siguiente estructura:
    {
      promptId: number,
      useCaseId: number,
      generatedResponse: string
    }`;

    return promptForLLM;
  }

  private buildConfusionMatrixPrompt(
    feature: Feature,
    generatedResponses: any[],
  ): string {
    let promptForLLM = `Analiza las siguientes respuestas generadas para la característica "${feature.description}" y genera una matriz de confusión para cada combinación de prompt y caso de uso:\n\n`;

    feature.useCases.forEach((useCase) => {
      const expectedResponseClass = feature.responseClasses.find(
        (rc) => rc.id === useCase.responseClassExpectedId,
      );

      feature.prompts.forEach((prompt) => {
        const generatedResponse = generatedResponses.find(
          (r) => r.promptId === prompt.id && r.useCaseId === useCase.id,
        );

        promptForLLM += `Prompt ID ${prompt.id}: ${prompt.content}\n`;
        promptForLLM += `Caso de uso ID ${useCase.id}: ${useCase.caseDescription}\n`;
        promptForLLM += `Clase de respuesta esperada: ${expectedResponseClass?.description}\n`;
        promptForLLM += `Respuesta generada: ${generatedResponse?.generatedResponse}\n\n`;
      });
    });

    promptForLLM += `Genera una matriz de confusión para cada combinación de prompt y caso de uso, comparando la respuesta generada con la clase de respuesta esperada. La matriz debe incluir truePositives, falsePositives, trueNegatives, y falseNegatives. Devuelve los resultados como un array de objetos JSON con la siguiente estructura:
    {
      promptId: number,
      useCaseId: number,
      truePositives: number,
      falsePositives: number,
      trueNegatives: number,
      falseNegatives: number
    }`;

    return promptForLLM;
  }
}
