import { describe, it, expect, beforeAll } from 'vitest';
import { UseCaseService } from '../UseCaseService.js';
import { FeatureService } from '../FeatureService.js';
import type { InsertUseCase } from '../../../shared/models/UseCase.js';
import { ResponseClassService } from '../ResponseClassService.js';
import { AIModelService } from '../AIModelService.js';

describe('UseCaseService', () => {
  let useCaseService: UseCaseService;
  let featureService: FeatureService;
  let responseClassService: ResponseClassService;
  let aIModelService: AIModelService;
  let featureId: number;
  let promptId: number;
  let responseClassId: number;
  let useCaseId: number;

  const NEON_URL = process.env.NEON_TEST_URL!;

  beforeAll(async () => {
    useCaseService = new UseCaseService(NEON_URL);
    featureService = new FeatureService(NEON_URL);
    responseClassService = new ResponseClassService(NEON_URL);
    aIModelService = new AIModelService(NEON_URL);

    const feature = await featureService.createFeature({
      name: 'Test Feature',
      description: 'Test Feature Description',
      model: 'Test Model',
      url: 'http://test.com',
    });
    featureId = feature.id;

    const responseClass = await responseClassService.createResponseClass({
      name: 'Test Response Class',
      description: 'Test Response Class Description',
      featureId: featureId,
    });
    responseClassId = responseClass.id;

    const prompt = await aIModelService.saveAIPrompt('Test Prompt', featureId);
    promptId = prompt.id;
  });

  it('should create a use case successfully', async () => {
    const useCaseData: InsertUseCase = {
      name: 'Test Use Case',
      caseDescription: 'Test Use Case Description',
      promptId: promptId,
      responseClassExpectedId: responseClassId,
      featureId: featureId,
    };
    const result = await useCaseService.createUseCase(useCaseData);
    useCaseId = result.id;

    expect(result).toMatchObject(useCaseData);
    expect(result.id).toBeDefined();
  });

  it('should throw an error when creating a use case with invalid featureId', async () => {
    const useCaseData = {
      name: 'Invalid Use Case',
      caseDescription: 'This should fail',
      promptId: promptId,
      responseClassExpectedId: responseClassId,
      featureId: 9999, // Invalid feature ID
    };

    await expect(useCaseService.createUseCase(useCaseData)).rejects.toThrow();
  });

  it('should get use cases by feature ID', async () => {
    const result = await useCaseService.getUseCasesByFeatureId(featureId);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.id).toBe(useCaseId);
  });

  it('should return an empty array for non-existent feature ID', async () => {
    const result = await useCaseService.getUseCasesByFeatureId(9999);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(0);
  });

  it('should get a use case by ID', async () => {
    const result = await useCaseService.getUseCaseById(useCaseId);

    expect(result).toBeDefined();
    expect(result?.id).toBe(useCaseId);
  });

  it('should return null for non-existent use case ID', async () => {
    const result = await useCaseService.getUseCaseById(9999);

    expect(result).toBeNull();
  });

  it('should update a use case successfully', async () => {
    const updatedData = {
      name: 'Updated Use Case',
      caseDescription: 'Updated Description',
      promptId: promptId,
      responseClassExpectedId: responseClassId,
      featureId: featureId,
    };

    await useCaseService.updateUseCase(useCaseId, updatedData);

    const updatedUseCase = await useCaseService.getUseCaseById(useCaseId);
    expect(updatedUseCase).toMatchObject(updatedData);
  });

  it('should throw an error when updating a non-existent use case', async () => {
    const updatedData = {
      name: 'Non-existent Use Case',
      caseDescription: 'This should fail',
      promptId: promptId,
      responseClassExpectedId: responseClassId,
      featureId: featureId,
    };

    await expect(
      useCaseService.updateUseCase(9999, updatedData),
    ).resolves.not.toThrow();
  });

  it('should delete a use case successfully', async () => {
    await useCaseService.deleteUseCase(useCaseId);

    const deletedUseCase = await useCaseService.getUseCaseById(useCaseId);
    expect(deletedUseCase).toBeNull();
  });

  it('should not throw an error when deleting a non-existent use case', async () => {
    await expect(useCaseService.deleteUseCase(9999)).resolves.not.toThrow();
  });
});
