import { describe, it, expect, beforeAll } from 'vitest';
import { FeatureService } from '../FeatureService.js';

describe('FeatureService', () => {
  let featureService: FeatureService;
  let featureId: number;
  const NEON_URL = process.env.NEON_TEST_URL!;

  beforeAll(async () => {
    featureService = new FeatureService(NEON_URL);
  });

  it('should create a feature successfully', async () => {
    const featureData = {
      name: 'Test Feature',
      description: 'Description',
      model: 'Model A',
      url: 'http://example.com',
    };
    const result = await featureService.createFeature(featureData);
    featureId = result.id;

    expect(result).toMatchObject(featureData);
    expect(result.id).toBeDefined();
  });

  it.todo('should throw an error if createFeature fails', async () => {
    const featureData = {
      name: 'Test Feature',
      description: 'Description',
      model: 'Model A',
      url: 'http://example.com',
    };

    await expect(featureService.createFeature(featureData)).rejects.toThrow(
      'Database Error',
    );
  });

  it('should get a feature by ID', async () => {
    const result = await featureService.getFeatureById(featureId);

    expect(result).toBeDefined();
    expect(result?.id).toBe(featureId);
  });

  it('should return null for non-existent feature ID', async () => {
    const result = await featureService.getFeatureById(999);

    expect(result).toBeNull();
  });

  it('should get all features', async () => {
    const result = await featureService.getFeatures();

    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should delete a feature by ID', async () => {
    await featureService.deleteFeature(featureId);

    const result = await featureService.getFeatureById(featureId);
    expect(result).toBeNull();
  });
});
