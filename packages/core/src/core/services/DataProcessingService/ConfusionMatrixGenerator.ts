import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Feature } from '../../../shared/models/Feature.js';
import type { ConfusionMatrixResult } from '../../../shared/models/ConfusionMatrix.js';

export class ConfusionMatrixGenerator {
  async generateConfusionMatrix(
    feature: Feature,
  ): Promise<ConfusionMatrixResult> {
    const groq = createOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

    //console.log('Generating responses...', feature);

    const generatedResponsesSchema = z.object({
      success: z.boolean(),
      values: z.array(
        z.object({
          promptId: z.number(),
          useCaseId: z.number(),
          generatedResponse: z.string(),
        }),
      ),
    });

    const { object: generatedResponsesObject } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: generatedResponsesSchema,
      prompt: this.buildResponseGenerationPrompt(feature),
    });

    if (!generatedResponsesObject.success) {
      throw new Error('Failed to generate responses.');
    }

    const generatedResponsesArray = generatedResponsesObject.values;

    //console.log('----Generated responses array:', generatedResponsesArray);

    const confusionMatrixSchema = z.object({
      success: z.boolean(),
      values: z.array(
        z.tuple([
          z.number(),
          z.number(),
          z.number(),
          z.number(),
          z.number(),
          z.number(),
        ]),
      ),
    });

    const { object: parsedConfusionMatrixObject } = await generateObject({
      model: groq('llama-3.1-70b-versatile'),
      schema: confusionMatrixSchema,
      prompt: this.buildConfusionMatrixPrompt(feature, generatedResponsesArray),
    });

    if (!parsedConfusionMatrixObject.success) {
      throw new Error('Failed to generate the confusion matrix.');
    }

    const parsedConfusionMatrix = parsedConfusionMatrixObject.values;

    //console.log('Parsed confusion matrix:', parsedConfusionMatrix);

    const confusionMatrixResult: ConfusionMatrixResult = {
      confusionMatrix: parsedConfusionMatrix.map((cm) => ({
        promptId: cm[0],
        useCaseId: cm[1],
        truePositives: cm[2],
        falsePositives: cm[3],
        trueNegatives: cm[4],
        falseNegatives: cm[5],
        featureId: feature.id,
      })),
      generatedTexts: generatedResponsesArray.map((gr) => ({
        id: `${gr.promptId}-${gr.useCaseId}`,
        text: gr.generatedResponse,
      })),
      expectedTexts: feature.useCases.map((uc) => ({
        id: `${uc.id}`,
        text:
          feature.responseClasses.find(
            (rc) => rc.id === uc.responseClassExpectedId,
          )?.description || '',
      })),
    };

    //console.log('Confusion Matrix Result:', confusionMatrixResult);

    confusionMatrixResult.generatedTexts.forEach((gt, index) => {
      if (!gt.text) {
        console.warn(
          `Generated text is undefined at index ${index} for useCaseId ${gt.id.split('-')[1]}`,
        );
      }
    });

    confusionMatrixResult.expectedTexts.forEach((et, index) => {
      if (!et.text) {
        console.warn(`Expected text is undefined for useCaseId ${et.id}`);
      }
    });

    return confusionMatrixResult;
  }

  private buildResponseGenerationPrompt(feature: Feature): string {
    let promptForLLM = `Genera un array de respuestas para cada uno de los siguientes casos de uso de la característica "${feature.description}":\n\n`;

    feature.prompts.forEach((prompt) => {
      promptForLLM += `Prompt ${prompt.id}: ${prompt.content}\n\n`;
      // Filtrar los casos de uso asociados a este prompt
      const relatedUseCases = feature.useCases.filter(
        (useCase) => useCase.promptId === prompt.id,
      );
      relatedUseCases.forEach((useCase) => {
        promptForLLM += `Caso de uso ${useCase.id}: ${useCase.caseDescription}\n\n`;
      });
    });

    promptForLLM += `Genera una respuesta para cada caso de uso utilizando el prompt correspondiente. Formato: Devuelve los resultados como un objeto JSON con la siguiente estructura:
    {
      success: boolean,
      values: [
        {
          promptId: number,
          useCaseId: number,
          generatedResponse: string
        },
        ...
      ]
    }`;

    return promptForLLM;
  }

  private buildConfusionMatrixPrompt(
    feature: Feature,
    generatedResponses: any[],
  ): string {
    let promptForLLM = `Analiza las siguientes respuestas generadas para la característica "${feature.description}" y genera una matriz de confusión para cada combinación de prompt y caso de uso:\n\n`;

    feature.prompts.forEach((prompt) => {
      // Filtrar los casos de uso asociados a este prompt
      const relatedUseCases = feature.useCases.filter(
        (useCase) => useCase.promptId === prompt.id,
      );

      relatedUseCases.forEach((useCase) => {
        const expectedResponseClass = feature.responseClasses.find(
          (rc) => rc.id === useCase.responseClassExpectedId,
        );

        const generatedResponse = generatedResponses.find(
          (r) => r.promptId === prompt.id && r.useCaseId === useCase.id,
        );

        promptForLLM += `Prompt ID ${prompt.id}: ${prompt.content}\n`;
        promptForLLM += `Caso de uso ID ${useCase.id}: ${useCase.caseDescription}\n`;
        promptForLLM += `Clase de respuesta esperada: ${expectedResponseClass?.description}\n`;
        promptForLLM += `Respuesta generada: ${generatedResponse?.generatedResponse}\n\n`;
      });
    });

    promptForLLM += `Genera una matriz de confusión para cada combinación de prompt y caso de uso, comparando la respuesta generada con la clase de respuesta esperada. La matriz debe incluir truePositives, falsePositives, trueNegatives, y falseNegatives. 
    Formato: Devuelve los resultados como un objeto JSON con la siguiente estructura:
    {
      success: boolean,
      values: [
        [promptId, useCaseId, truePositives, falsePositives, trueNegatives, falseNegatives],
        ...
      ]
    }
    Ejemplo: {
      "success": true,
      "values": [
        [1, 1, 5, 2, 8, 1],
        [1, 2, 4, 3, 7, 2],
        ...
      ]
    }`;

    //console.log('----Prompt for LLM:', promptForLLM);

    return promptForLLM;
  }
}
