import { eq, inArray } from 'drizzle-orm';
import {
  FeatureTable,
  AIPromptTable,
  UseCaseTable,
  ResponseClassTable,
  AIStringTable,
} from '../../../shared/models/drizzle_schema.js';
import type { Feature } from '../../../shared/models/Feature.js';
import { getDB } from '../../../shared/utils/Database.js';

export class FeatureDataLoader {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    this.db = getDB(NEON_URL);
  }

  async getFeatureData(featureId: number): Promise<Feature> {
    const feature = await this.db
      .select()
      .from(FeatureTable)
      .where(eq(FeatureTable.id, featureId))
      .execute();

    if (!feature || feature.length === 0 || !feature[0]) {
      throw new Error(`Feature with id ${featureId} not found`);
    }

    const prompts = await this.db
      .select()
      .from(AIPromptTable)
      .where(eq(AIPromptTable.featureId, featureId))
      .execute();
    const useCases = await this.db
      .select()
      .from(UseCaseTable)
      .where(eq(UseCaseTable.featureId, featureId))
      .execute();
    const responseClasses = await this.db
      .select()
      .from(ResponseClassTable)
      .where(eq(ResponseClassTable.featureId, featureId))
      .execute();

    const promptIds = prompts.map((prompt) => prompt.id);
    const promptStrings = await this.db
      .select()
      .from(AIStringTable)
      .where(
        inArray(
          AIStringTable.id,
          prompts.flatMap((p) => p.stringsIds),
        ),
      )
      .execute();

    const promptContents = prompts.map((prompt) => ({
      ...prompt,
      content: prompt.stringsIds
        .map((id) => promptStrings.find((s) => s.id === id)?.content)
        .join(''),
    }));

    const featureToReturn: Feature = {
      id: feature[0].id,
      name: feature[0].name,
      description: feature[0].description,
      model: feature[0].model,
      url: feature[0].url,
      prompts: promptContents,
      useCases,
      responseClasses,
    };

    return featureToReturn;
  }
}
