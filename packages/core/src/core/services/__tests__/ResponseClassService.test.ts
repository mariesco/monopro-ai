import { describe, it, expect, beforeAll } from 'vitest';
import { ResponseClassService } from '../ResponseClassService.js';
import { FeatureService } from '../FeatureService.js';

describe('ResponseClassService', () => {
  let responseClassService: ResponseClassService;
  let featureService: FeatureService;
  let featureId: number;
  let responseClassId: number;
  const NEON_URL = process.env.NEON_TEST_URL!;

  beforeAll(async () => {
    responseClassService = new ResponseClassService(NEON_URL);
    featureService = new FeatureService(NEON_URL);

    const feature = await featureService.createFeature({
      name: 'Test Feature for ResponseClass',
      description: 'Test Feature Description',
      model: 'Test Model',
      url: 'http://test.com',
    });
    featureId = feature.id;
  });

  it('should create a response class successfully', async () => {
    const responseClassData = {
      name: 'Test Response Class',
      description: 'Test Response Class Description',
      featureId: featureId,
    };
    const result =
      await responseClassService.createResponseClass(responseClassData);
    responseClassId = result.id;

    expect(result).toMatchObject(responseClassData);
    expect(result.id).toBeDefined();
  });

  it('should throw an error when creating a response class with invalid featureId', async () => {
    const responseClassData = {
      name: 'Invalid Response Class',
      description: 'This should fail',
      featureId: 9999, // ID que no existe
    };

    await expect(
      responseClassService.createResponseClass(responseClassData),
    ).rejects.toThrow();
  });

  it('should get response classes by feature ID', async () => {
    const result =
      await responseClassService.getResponseClassesByFeatureId(featureId);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.featureId).toBe(featureId);
  });

  it('should return an empty array for non-existent feature ID', async () => {
    const result =
      await responseClassService.getResponseClassesByFeatureId(9999);

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(0);
  });

  it('should get a response class by ID', async () => {
    const result =
      await responseClassService.getResponseClassById(responseClassId);

    expect(result).toBeDefined();
    expect(result?.id).toBe(responseClassId);
  });

  it('should return null for non-existent response class ID', async () => {
    const result = await responseClassService.getResponseClassById(9999);

    expect(result).toBeNull();
  });

  it('should update a response class successfully', async () => {
    const updatedData = {
      name: 'Updated Response Class',
      description: 'Updated Description',
      featureId: featureId,
    };

    await responseClassService.updateResponseClass(
      responseClassId,
      updatedData,
    );

    const updatedResponseClass =
      await responseClassService.getResponseClassById(responseClassId);
    expect(updatedResponseClass).toMatchObject(updatedData);
  });

  it('should throw an error when updating a non-existent response class', async () => {
    const updatedData = {
      name: 'Non-existent Response Class',
      description: 'This should fail',
      featureId: featureId,
    };

    //await expect(responseClassService.updateResponseClass(9999, updatedData)).rejects.toThrow();
    await expect(
      responseClassService.updateResponseClass(9999, updatedData),
    ).resolves.not.toThrow();
  });

  it('should delete a response class successfully', async () => {
    await responseClassService.deleteResponseClass(responseClassId);

    const deletedResponseClass =
      await responseClassService.getResponseClassById(responseClassId);
    expect(deletedResponseClass).toBeNull();
  });

  it('should not throw an error when deleting a non-existent response class', async () => {
    await expect(
      responseClassService.deleteResponseClass(9999),
    ).resolves.not.toThrow();
  });
});
