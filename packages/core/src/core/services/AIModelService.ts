import { eq, inArray } from 'drizzle-orm';
import {
  selectAIPromptSchema,
  type SelectAIPrompt,
  type SelectAIResponse,
} from '../../shared/models/AIModel.js';
import {
  AIPromptTable,
  AIResponseTable,
  AIStringTable,
} from '../../shared/models/drizzle_schema.js';
import { getDB } from '../../shared/utils/Database.js';

export class AIModelService {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    if (!NEON_URL) {
      throw new Error('NEON_URL is not defined.');
    }
    this.db = getDB(NEON_URL!);
  }

  private async getOrCreateStrings(
    contents: string[],
  ): Promise<Map<string, number>> {
    const existingStrings = await this.db
      .select()
      .from(AIStringTable)
      .where(inArray(AIStringTable.content, contents));

    const stringMap = new Map(
      existingStrings.map((str) => [str.content, str.id]),
    );

    for (const content of contents) {
      if (!stringMap.has(content)) {
        const [newString] = await this.db
          .insert(AIStringTable)
          .values({ content })
          .returning();
        stringMap.set(content, newString!.id);
      }
    }

    return stringMap;
  }

  private async saveStrings(data: string): Promise<number[]> {
    const regex = /[\wáéíóúüñ]+|[^\w\s]|\s/g;
    const uniqueStrings = data.match(regex) || [];
    const stringMap = await this.getOrCreateStrings(uniqueStrings);
    return uniqueStrings.map((content) => stringMap.get(content)!);
  }

  async saveAIPrompt(
    promptData: string,
    featureId: number,
  ): Promise<SelectAIPrompt> {
    const stringIds = await this.saveStrings(promptData);
    const [newPrompt] = await this.db
      .insert(AIPromptTable)
      .values({ stringsIds: stringIds, featureId })
      .returning();
    return newPrompt as SelectAIPrompt;
  }

  async readAIPrompt(promptId: number): Promise<string> {
    const [prompt] = await this.db
      .select()
      .from(AIPromptTable)
      .where(eq(AIPromptTable.id, promptId));

    if (!prompt) {
      throw new Error('Prompt not found');
    }

    const strings = await this.db
      .select()
      .from(AIStringTable)
      .where(inArray(AIStringTable.id, prompt.stringsIds));

    const stringMap = new Map(strings.map((s) => [s.id, s.content]));

    return prompt.stringsIds.map((id) => stringMap.get(id)).join('');
  }

  async getPromptsByFeatureId(
    featureId: number,
  ): Promise<{ id: number; content: string; featureId: number }[]> {
    const prompts = await this.db
      .select()
      .from(AIPromptTable)
      .where(eq(AIPromptTable.featureId, featureId));

    if (!prompts.length) {
      return [];
    }

    const allStringIds = prompts.flatMap((prompt) => prompt.stringsIds);

    if (!allStringIds.length) {
      return [];
    }

    const strings = await this.db
      .select()
      .from(AIStringTable)
      .where(inArray(AIStringTable.id, allStringIds));

    const stringMap = new Map(strings.map((s) => [s.id, s.content]));

    const result = prompts.map((prompt) => ({
      id: prompt.id,
      content: prompt.stringsIds.map((id) => stringMap.get(id)).join(''),
      featureId: prompt.featureId,
    }));

    return result;
  }

  async saveAIResponse(
    responseData: string,
    promptId: number,
  ): Promise<SelectAIResponse> {
    const stringIds = await this.saveStrings(responseData);
    const [newResponse] = await this.db
      .insert(AIResponseTable)
      .values({ stringsIds: stringIds, promptId })
      .returning();
    return newResponse as SelectAIResponse;
  }

  async readAIResponse(responseId: number): Promise<string> {
    const [response] = await this.db
      .select()
      .from(AIResponseTable)
      .where(eq(AIResponseTable.id, responseId));

    if (!response) {
      throw new Error('Response not found');
    }

    const strings = await this.db
      .select()
      .from(AIStringTable)
      .where(inArray(AIStringTable.id, response.stringsIds));

    const stringMap = new Map(strings.map((s) => [s.id, s.content]));

    return response.stringsIds.map((id) => stringMap.get(id)).join('');
  }

  private async saveStringsForInteraction(
    promptData: string,
    responseData?: string,
  ): Promise<{ promptIds: number[]; responseIds: number[] }> {
    const regex = /[\wáéíóúüñ]+|[^\w\s]|\s/g;
    const promptStrings = promptData.match(regex) || [];
    const responseStrings = responseData ? responseData.match(regex) || [] : [];
    const allStrings = [...new Set([...promptStrings, ...responseStrings])];

    const stringMap = await this.getOrCreateStrings(allStrings);

    return {
      promptIds: promptStrings.map((content) => stringMap.get(content)!),
      responseIds: responseData
        ? responseStrings.map((content) => stringMap.get(content)!)
        : [],
    };
  }

  async saveAIInteraction(
    promptData: string | undefined,
    responseData: string | undefined,
    featureId: number,
  ): Promise<{ promptId?: number; responseId?: number }> {
    const result: { promptId?: number; responseId?: number } = {};

    if (promptData) {
      const { promptIds, responseIds } = await this.saveStringsForInteraction(
        promptData,
        responseData,
      );

      const [newPrompt] = await this.db
        .insert(AIPromptTable)
        .values({ stringsIds: promptIds, featureId })
        .returning();
      result.promptId = newPrompt?.id;
      if (responseData && newPrompt) {
        const [newResponse] = await this.db
          .insert(AIResponseTable)
          .values({ stringsIds: responseIds, promptId: newPrompt.id })
          .returning();
        result.responseId = newResponse?.id;
      }
    } else if (responseData) {
      console.warn('No se puede guardar una respuesta sin un prompt asociado');
    }

    return result;
  }

  async deleteAIPrompt(
    promptId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const associatedResponses = await this.db
        .select({ id: AIResponseTable.id })
        .from(AIResponseTable)
        .where(eq(AIResponseTable.promptId, promptId))
        .limit(1);

      if (associatedResponses.length > 0) {
        return {
          success: false,
          message:
            'Cannot delete the prompt because it has associated responses.',
        };
      }

      const result = await this.db
        .delete(AIPromptTable)
        .where(eq(AIPromptTable.id, promptId));

      if (result.rowCount > 0) {
        return {
          success: true,
          message: 'The prompt was deleted correctly.',
        };
      } else {
        return {
          success: false,
          message: 'The prompt specified was not found.',
        };
      }
    } catch (error) {
      console.error('Error al intentar eliminar el prompt:', error);
      return {
        success: false,
        message: 'An error occurred while trying to delete the prompt.',
      };
    }
  }
}
