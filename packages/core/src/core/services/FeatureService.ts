import {
  selectFeatureSchema,
  insertFeatureSchema,
} from '../../shared/models/Feature.js';
import { FeatureTable } from '../../shared/models/drizzle_schema.js';
import type {
  InsertFeature,
  SelectFeature,
} from '../../shared/models/Feature.js';
import { getDB } from '../../shared/utils/Database.js';
import { eq } from 'drizzle-orm';

export class FeatureService {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    if (!NEON_URL) {
      throw new Error('NEON_URL is not defined.');
    }
    this.db = getDB(NEON_URL!);
  }

  async createFeature(featureData: InsertFeature): Promise<SelectFeature> {
    const feature = insertFeatureSchema.parse(featureData);
    const [insertedFeature] = await this.db
      .insert(FeatureTable)
      .values(feature)
      .returning();
    return selectFeatureSchema.parse(insertedFeature);
  }

  async getFeatureById(id: number): Promise<SelectFeature | null> {
    const feature = await this.db
      .select()
      .from(FeatureTable)
      .where(eq(FeatureTable.id, id))
      .limit(1);
    return feature.length > 0 ? selectFeatureSchema.parse(feature[0]) : null;
  }

  async getFeatures(): Promise<SelectFeature[]> {
    const features = await this.db.select().from(FeatureTable);
    //TODO: Add validation with zod
    return features.map((f) => selectFeatureSchema.parse(f));
    // return features;
  }

  async deleteFeature(id: number): Promise<void> {
    await this.db.delete(FeatureTable).where(eq(FeatureTable.id, id));
  }
}
