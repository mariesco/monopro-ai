import { describe, it, expect, beforeAll } from 'vitest';
import { AIModelManagementService } from '../AIModelManagementService.js';
import type { InsertAIProvider, InsertAIModel, InsertAIModelConfig, InsertAIModelBranch, InsertAIModelPullRequest } from '../../../shared/models/AIModelManagement.js';

describe('AIModelManagementService', () => {
  let aiModelManagementService: AIModelManagementService;
  let providerId: number;
  let modelId: number;
  let configId: number;
  let branchId: number;
  let pullRequestId: number;
  const NEON_URL = process.env.NEON_TEST_URL!;

  beforeAll(async () => {
    aiModelManagementService = new AIModelManagementService(NEON_URL);
  });

  it('should create a provider successfully', async () => {
    const providerData: InsertAIProvider = {
      name: 'Test Provider',
      description: 'Test Provider Description',
    };
    const result = await aiModelManagementService.createProvider(providerData);
    providerId = result.id;

    expect(result).toMatchObject(providerData);
    expect(result.id).toBeDefined();
  });

  it('should get all providers', async () => {
    const result = await aiModelManagementService.getProviders();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should create a model successfully', async () => {
    const modelData: InsertAIModel = {
      name: 'Test Model',
      providerId,
      description: 'Test Model Description',
      capabilities: ['capability1', 'capability2'],
    };
    const result = await aiModelManagementService.createModel(modelData);
    modelId = result.id;

    expect(result).toMatchObject(modelData);
    expect(result.id).toBeDefined();
  });

  it('should get all models', async () => {
    const result = await aiModelManagementService.getModels();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should update a model successfully', async () => {
    const updateData: Partial<InsertAIModel> = {
      description: 'Updated Test Model Description',
    };
    const result = await aiModelManagementService.updateModel(modelId, updateData);

    expect(result.description).toBe(updateData.description);
  });

  it('should get model details', async () => {
    const result = await aiModelManagementService.getModelDetails(modelId);

    expect(result).toBeDefined();
    expect(result?.id).toBe(modelId);
  });

  it('should create a model config successfully', async () => {
    const configData: InsertAIModelConfig = {
      modelId,
      maxTokens: 100,
      temperature: 0.7,
      topP: 0.9,
      presencePenalty: 0.5,
      frequencyPenalty: 0.5,
      stopSequences: ['stop1', 'stop2'],
    };
    const result = await aiModelManagementService.createModelConfig(configData);
    configId = result.id;

    expect(result).toMatchObject(configData);
    expect(result.id).toBeDefined();
  });

  it('should create a model branch successfully', async () => {
    const branchData: InsertAIModelBranch = {
      name: 'Test Branch',
      modelId,
      configId,
      isProduction: false,
    };
    const result = await aiModelManagementService.createModelBranch(branchData);
    branchId = result.id;

    expect(result).toMatchObject(branchData);
    expect(result.id).toBeDefined();
  });

  it('should get model branches', async () => {
    const result = await aiModelManagementService.getModelBranches(modelId);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should create a pull request successfully', async () => {
    const pullRequestData: InsertAIModelPullRequest = {
      title: 'Test Pull Request',
      description: 'Test Pull Request Description',
      sourceBranchId: branchId,
      targetBranchId: branchId, // Using the same branch for simplicity
      status: 'open',
    };
    const result = await aiModelManagementService.createPullRequest(pullRequestData);
    pullRequestId = result.id;

    expect(result).toMatchObject(pullRequestData);
    expect(result.id).toBeDefined();
  });

  it('should get pull requests', async () => {
    const result = await aiModelManagementService.getPullRequests(modelId);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should update pull request status', async () => {
    const result = await aiModelManagementService.updatePullRequestStatus(pullRequestId, 'closed');

    expect(result.status).toBe('closed');
  });

  it('should compare branches', async () => {
    const result = await aiModelManagementService.compareBranches(branchId, branchId); // Using the same branch for simplicity

    expect(result).toHaveProperty('branch1');
    expect(result).toHaveProperty('branch2');
    expect(result.branch1.id).toBe(branchId);
    expect(result.branch2.id).toBe(branchId);
  });

  it('should delete a model branch', async () => {
    await aiModelManagementService.deleteModelBranch(branchId);

    const branches = await aiModelManagementService.getModelBranches(modelId);
    expect(branches.find(b => b.id === branchId)).toBeUndefined();
  });
});
