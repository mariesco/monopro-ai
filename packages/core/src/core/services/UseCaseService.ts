import { eq } from 'drizzle-orm';
import { getDB } from '../../shared/utils/Database.js';
import { UseCaseTable } from '../../shared/models/drizzle_schema.js';
import {
  insertUseCaseSchema,
  selectUseCaseSchema,
  type InsertUseCase,
  type SelectUseCase,
} from '../../shared/models/UseCase.js';

export class UseCaseService {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    if (!NEON_URL) {
      throw new Error('NEON_URL is not defined.');
    }
    this.db = getDB(NEON_URL!);
  }

  async createUseCase(useCaseData: InsertUseCase): Promise<SelectUseCase> {
    const useCase = insertUseCaseSchema.parse(useCaseData);
    const [insertedUseCase] = await this.db
      .insert(UseCaseTable)
      .values(useCase)
      .returning();
    return selectUseCaseSchema.parse(insertedUseCase);
  }

  async getUseCasesByFeatureId(featureId: number): Promise<SelectUseCase[]> {
    const useCases = await this.db
      .select()
      .from(UseCaseTable)
      .where(eq(UseCaseTable.featureId, featureId));
    return useCases.map((uc) => selectUseCaseSchema.parse(uc));
  }

  async getUseCaseById(id: number): Promise<SelectUseCase | null> {
    const useCase = await this.db
      .select()
      .from(UseCaseTable)
      .where(eq(UseCaseTable.id, id))
      .limit(1);
    return useCase.length > 0 ? selectUseCaseSchema.parse(useCase[0]) : null;
  }

  async updateUseCase(id: number, useCaseData: InsertUseCase): Promise<void> {
    await this.db
      .update(UseCaseTable)
      .set(useCaseData)
      .where(eq(UseCaseTable.id, id));
  }

  async deleteUseCase(id: number): Promise<void> {
    await this.db.delete(UseCaseTable).where(eq(UseCaseTable.id, id));
  }
}
