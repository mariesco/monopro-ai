import { eq } from 'drizzle-orm';
import { ResponseClassTable } from '../../shared/models/drizzle_schema.js';
import {
  insertResponseClassSchema,
  selectResponseClassSchema,
  type InsertResponseClass,
  type SelectResponseClass,
} from '../../shared/models/ResponseClass.js';
import { getDB } from '../../shared/utils/Database.js';

export class ResponseClassService {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    if (!NEON_URL) {
      throw new Error('NEON_URL is not defined.');
    }
    this.db = getDB(NEON_URL!);
  }

  async createResponseClass(
    responseClassData: InsertResponseClass,
  ): Promise<SelectResponseClass> {
    const responseClass = insertResponseClassSchema.parse(responseClassData);
    const [insertedResponseClass] = await this.db
      .insert(ResponseClassTable)
      .values(responseClass)
      .returning();
    return selectResponseClassSchema.parse(insertedResponseClass);
  }

  async getResponseClassesByFeatureId(
    featureId: number,
  ): Promise<SelectResponseClass[]> {
    const responseClasses = await this.db
      .select()
      .from(ResponseClassTable)
      .where(eq(ResponseClassTable.featureId, featureId));
    return responseClasses.map((rc) => selectResponseClassSchema.parse(rc));
  }

  async getResponseClassById(id: number): Promise<SelectResponseClass | null> {
    const responseClass = await this.db
      .select()
      .from(ResponseClassTable)
      .where(eq(ResponseClassTable.id, id))
      .limit(1);
    return responseClass.length > 0
      ? selectResponseClassSchema.parse(responseClass[0])
      : null;
  }

  async updateResponseClass(
    id: number,
    responseClassData: InsertResponseClass,
  ): Promise<void> {
    await this.db
      .update(ResponseClassTable)
      .set(responseClassData)
      .where(eq(ResponseClassTable.id, id));
  }

  async deleteResponseClass(id: number): Promise<void> {
    await this.db
      .delete(ResponseClassTable)
      .where(eq(ResponseClassTable.id, id));
  }
}
