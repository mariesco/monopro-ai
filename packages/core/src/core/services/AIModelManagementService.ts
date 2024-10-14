import { getDB } from '../../shared/utils/Database.js';
import { eq, or } from 'drizzle-orm';
import {
  AIProviderTable,
  AIModelTable,
  AIModelConfigTable,
  AIModelBranchTable,
  AIModelPullRequestTable,
} from '../../shared/models/drizzle_schema.js';
import {
  insertAIProviderSchema,
  selectAIProviderSchema,
  insertAIModelSchema,
  selectAIModelSchema,
  insertAIModelConfigSchema,
  selectAIModelConfigSchema,
  insertAIModelBranchSchema,
  selectAIModelBranchSchema,
  insertAIModelPullRequestSchema,
  AIModelPullRequestSchema,
} from '../../shared/models/AIModelManagement.js';
import type {
  InsertAIProvider,
  SelectAIProvider,
  InsertAIModel,
  SelectAIModel,
  InsertAIModelConfig,
  SelectAIModelConfig,
  InsertAIModelBranch,
  SelectAIModelBranch,
  InsertAIModelPullRequest,
  AIModelPullRequest,
} from '../../shared/models/AIModelManagement.js';

export class AIModelManagementService {
  private db: ReturnType<typeof getDB>;

  constructor(NEON_URL: string) {
    if (!NEON_URL) {
      throw new Error('NEON_URL is not defined.');
    }
    this.db = getDB(NEON_URL);
  }

  // AIProvider methods
  async createProvider(providerData: InsertAIProvider): Promise<SelectAIProvider> {
    const provider = insertAIProviderSchema.parse(providerData);
    const [insertedProvider] = await this.db
      .insert(AIProviderTable)
      .values(provider)
      .returning();
    return selectAIProviderSchema.parse(insertedProvider);
  }

  async getProviders(): Promise<SelectAIProvider[]> {
    const providers = await this.db.select().from(AIProviderTable);
    return providers.map((p) => selectAIProviderSchema.parse(p));
  }

  // AIModel methods
  async createModel(modelData: InsertAIModel): Promise<SelectAIModel> {
    const model = insertAIModelSchema.parse(modelData);
    const [insertedModel] = await this.db
      .insert(AIModelTable)
      .values({
        ...model,
        capabilities: model.capabilities as string[],
      })
      .returning();
    return selectAIModelSchema.parse(insertedModel);
  }

  async getModels(): Promise<SelectAIModel[]> {
    const models = await this.db.select().from(AIModelTable);
    return models.map((m) => selectAIModelSchema.parse(m));
  }

  async updateModel(id: number, modelData: Partial<InsertAIModel>): Promise<SelectAIModel> {
    const [updatedModel] = await this.db
      .update(AIModelTable)
      .set({
        ...modelData,
        capabilities: modelData.capabilities as string[],
      })
      .where(eq(AIModelTable.id, id))
      .returning();
    return selectAIModelSchema.parse(updatedModel);
  }

  async getModelDetails(id: number): Promise<SelectAIModel | null> {
    const model = await this.db
      .select()
      .from(AIModelTable)
      .where(eq(AIModelTable.id, id))
      .limit(1);
    return model.length > 0 ? selectAIModelSchema.parse(model[0]) : null;
  }

  // AIModelConfig methods
  async createModelConfig(configData: InsertAIModelConfig): Promise<SelectAIModelConfig> {
    const config = insertAIModelConfigSchema.parse(configData);
    const [insertedConfig] = await this.db
      .insert(AIModelConfigTable)
      .values({
        ...config,
        stopSequences: config.stopSequences as string[],
      })
      .returning();
    return selectAIModelConfigSchema.parse(insertedConfig);
  }

  // AIModelBranch methods
  async createModelBranch(branchData: InsertAIModelBranch): Promise<SelectAIModelBranch> {
    const branch = insertAIModelBranchSchema.parse(branchData);
    const [insertedBranch] = await this.db
      .insert(AIModelBranchTable)
      .values(branch)
      .returning();
    return selectAIModelBranchSchema.parse(insertedBranch);
  }

  async getModelBranches(modelId: number): Promise<SelectAIModelBranch[]> {
    const branches = await this.db
      .select()
      .from(AIModelBranchTable)
      .where(eq(AIModelBranchTable.modelId, modelId));
    return branches.map((b) => selectAIModelBranchSchema.parse(b));
  }

  async deleteModelBranch(id: number): Promise<void> {
    try {
      await this.db
        .delete(AIModelPullRequestTable)
        .where(
          or(
            eq(AIModelPullRequestTable.sourceBranchId, id),
            eq(AIModelPullRequestTable.targetBranchId, id)
          )
        );
  
      await this.db
        .delete(AIModelBranchTable)
        .where(eq(AIModelBranchTable.id, id));
    } catch (error) {
      console.error('Error deleting model branch:', error);
      throw new Error('Failed to delete model branch');
    }
  }

  // AIModelPullRequest methods
  async createPullRequest(prData: InsertAIModelPullRequest): Promise<AIModelPullRequest> {
    const pullRequest = insertAIModelPullRequestSchema.parse(prData);
    const [insertedPR] = await this.db
      .insert(AIModelPullRequestTable)
      .values(pullRequest)
      .returning();
    return AIModelPullRequestSchema.parse(insertedPR);
  }

  async getPullRequests(modelId: number): Promise<AIModelPullRequest[]> {
   //const pullRequests = await this.db
   //  .select()
   //  .from(AIModelPullRequestTable)
   //  .innerJoin(AIModelBranchTable, eq(AIModelPullRequestTable.sourceBranchId, AIModelBranchTable.id))
   //  .where(eq(AIModelBranchTable.modelId, modelId));
   //return pullRequests.map((pr) => AIModelPullRequestSchema.parse(pr));
    const pullRequests = await this.db
        .select({
        pullRequest: AIModelPullRequestTable,
        branch: AIModelBranchTable
        })
        .from(AIModelPullRequestTable)
        .innerJoin(AIModelBranchTable, eq(AIModelPullRequestTable.sourceBranchId, AIModelBranchTable.id))
        .where(eq(AIModelBranchTable.modelId, modelId));
    return pullRequests.map((pr) => AIModelPullRequestSchema.parse(pr.pullRequest));
  }

  async updatePullRequestStatus(id: number, status: 'open' | 'closed' | 'merged'): Promise<AIModelPullRequest> {
    const [updatedPR] = await this.db
      .update(AIModelPullRequestTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(AIModelPullRequestTable.id, id))
      .returning();
    return AIModelPullRequestSchema.parse(updatedPR);
  }

  // Comparison method
  async compareBranches(branchId1: number, branchId2: number): Promise<{branch1: SelectAIModelBranch, branch2: SelectAIModelBranch}> {
    const [branch1, branch2] = await Promise.all([
      this.db.select().from(AIModelBranchTable).where(eq(AIModelBranchTable.id, branchId1)).limit(1),
      this.db.select().from(AIModelBranchTable).where(eq(AIModelBranchTable.id, branchId2)).limit(1)
    ]);
    
    if (!branch1.length || !branch2.length) {
      throw new Error('One or both branches not found');
    }

    return {
      branch1: selectAIModelBranchSchema.parse(branch1[0]),
      branch2: selectAIModelBranchSchema.parse(branch2[0])
    };
  }
}
