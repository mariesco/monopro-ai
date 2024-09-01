import { eq, inArray } from 'drizzle-orm';
import type { SelectAIPrompt } from '../../shared/models/AIModel.js';
import {
  AIPromptTable,
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

  async saveAIPrompt(
    promptData: string,
    featureId: number,
  ): Promise<SelectAIPrompt> {
    const regex = /[\wáéíóúüñ]+|[^\w\s]|\s/g;
    const uniqueStrings = promptData.match(regex) || [];

    const existingStrings = await this.db
      .select()
      .from(AIStringTable)
      .where(inArray(AIStringTable.content, uniqueStrings));

    const existingStringMap = new Map(
      existingStrings.map((str) => [str.content, str.id]),
    );

    const stringIds: number[] = [];

    for (const content of uniqueStrings) {
      let stringId = existingStringMap.get(content);

      if (!stringId) {
        const [newString] = await this.db
          .insert(AIStringTable)
          .values({ content })
          .returning();
        stringId = newString!.id;
        existingStringMap.set(content, stringId);
      }

      stringIds.push(stringId);
    }

    const [newPrompt] = await this.db
      .insert(AIPromptTable)
      .values({
        stringsIds: stringIds,
        featureId,
      })
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
}
