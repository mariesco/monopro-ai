import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureDataLoader } from '../../DataProcessingService/FeatureDataLoader.js';
import { getDB } from '../../../../shared/utils/Database.js';

// Mock de la función getDB
vi.mock('../../../../shared/utils/Database.js', () => ({
  getDB: vi.fn(),
}));

describe('DataProcessingService => FeatureDataLoader', () => {
  let featureDataLoader: FeatureDataLoader;
  const NEON_URL = 'mock_neon_url';

  beforeEach(() => {
    featureDataLoader = new FeatureDataLoader(NEON_URL);
  });

  it('should get feature data successfully', async () => {
    const mockFeatureId = 1;
    const mockFeature = {
      id: mockFeatureId,
      name: 'Test Feature',
      description: 'Test Description',
      model: 'Test Model',
      url: 'http://test.com',
    };
    const mockPrompts = [
      { id: 1, stringsIds: [1, 2], featureId: mockFeatureId },
    ];
    const mockUseCases = [
      { id: 1, name: 'Test Use Case', featureId: mockFeatureId },
    ];
    const mockResponseClasses = [
      { id: 1, name: 'Test Response Class', featureId: mockFeatureId },
    ];
    const mockPromptStrings = [
      { id: 1, content: 'Test prompt content 1' },
      { id: 2, content: 'Test prompt content 2' },
    ];

    const mockDB = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi
        .fn()
        .mockResolvedValueOnce([mockFeature])
        .mockResolvedValueOnce(mockPrompts)
        .mockResolvedValueOnce(mockUseCases)
        .mockResolvedValueOnce(mockResponseClasses)
        .mockResolvedValueOnce(mockPromptStrings),
    };

    vi.mocked(getDB).mockReturnValue(mockDB as any);

    const result = await featureDataLoader.getFeatureData(mockFeatureId);

    expect(result).toEqual({
      ...mockFeature,
      prompts: [
        {
          ...mockPrompts[0],
          content: 'Test prompt content 1Test prompt content 2',
        },
      ],
      useCases: mockUseCases,
      responseClasses: mockResponseClasses,
    });

    expect(mockDB.select).toHaveBeenCalledTimes(5);
    expect(mockDB.from).toHaveBeenCalledTimes(5);
    expect(mockDB.where).toHaveBeenCalledTimes(5);
    expect(mockDB.execute).toHaveBeenCalledTimes(5);
  });

  it('should throw an error when feature is not found', async () => {
    const mockFeatureId = 999;

    const mockDB = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(getDB).mockReturnValue(mockDB as any);

    await expect(
      featureDataLoader.getFeatureData(mockFeatureId),
    ).rejects.toThrow(`Feature with id ${mockFeatureId} not found`);
  });
});
