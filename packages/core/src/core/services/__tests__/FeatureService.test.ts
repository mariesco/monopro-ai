import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureService } from '../FeatureService.js';
import { getDB } from '../../../shared/utils/Database.js';
import { FeatureTable } from '../../../shared/models/drizzle_schema.js';

vi.mock('../../shared/utils/Database', () => ({
  getDB: vi.fn(),
}));

describe('FeatureService', () => {
  let featureService: FeatureService;
  const mockDB = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    featureService = new FeatureService('http://localhost:3000');
  });

  it('should create a feature successfully', async () => {
    const featureData = {
      name: 'Test Feature',
      description: 'Description',
      model: 'Model A',
      url: 'http://example.com',
    };
    const insertedFeature = { id: 1, ...featureData };
    mockDB.insert.mockReturnValue([{ ...insertedFeature }]);

    const result = await featureService.createFeature(featureData);

    expect(mockDB.insert).toHaveBeenCalledWith(FeatureTable, featureData);
    expect(result).toEqual(insertedFeature);
  });

  it('should throw an error if createFeature fails', async () => {
    const featureData = {
      name: 'Test Feature',
      description: 'Description',
      model: 'Model A',
      url: 'http://example.com',
    };
    mockDB.insert.mockRejectedValue(new Error('Database Error'));

    await expect(featureService.createFeature(featureData)).rejects.toThrow(
      'Database Error',
    );
  });
});
