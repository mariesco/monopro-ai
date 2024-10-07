import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataProcessingService } from '../../DataProcessingService/index.js';
import { FeatureDataLoader } from '../../DataProcessingService/FeatureDataLoader.js';
import { ConfusionMatrixGenerator } from '../../DataProcessingService/ConfusionMatrix/index.js';
import { DatabaseOperations } from '../../DataProcessingService/DatabaseOperations.js';
import { MetricsCalculator } from '../../DataProcessingService/MetricsCalculator.js';

// Mocks
vi.mock('../DataProcessingService/FeatureDataLoader.js');
vi.mock('../DataProcessingService/ConfusionMatrixGenerator.js');
vi.mock('../DataProcessingService/DatabaseOperations.js');
vi.mock('../DataProcessingService/MetricsCalculator.js');

describe('DataProcessingService', () => {
  let dataProcessingService: DataProcessingService;
  const NEON_URL = 'mock_neon_url';

  beforeEach(() => {
    dataProcessingService = new DataProcessingService(NEON_URL);
  });

  it('should process a feature successfully', async () => {
    const mockFeatureId = 1;
    const mockFeature = { id: mockFeatureId, name: 'Test Feature' };
    const mockConfusionMatrixResult = {
      confusionMatrix: [
        {
          id: 1,
          truePositives: 5,
          falsePositives: 2,
          trueNegatives: 8,
          falseNegatives: 1,
        },
      ],
      generatedTexts: [{ id: '1-1', text: 'Generated text' }],
      expectedTexts: [{ id: '1', text: 'Expected text' }],
    };
    const mockMetrics = [
      { name: 'Accuracy', value: '90%', type: 'classification' },
    ];

    // Mock implementations
    vi.mocked(FeatureDataLoader.prototype.getFeatureData).mockResolvedValue(
      mockFeature as any,
    );
    vi.mocked(
      ConfusionMatrixGenerator.prototype.generateConfusionMatrix,
    ).mockResolvedValue(mockConfusionMatrixResult as any);
    vi.mocked(
      DatabaseOperations.prototype.saveConfusionMatrix,
    ).mockResolvedValue(mockConfusionMatrixResult.confusionMatrix as any);
    vi.mocked(MetricsCalculator.prototype.calculateMetrics).mockResolvedValue(
      mockMetrics as any,
    );
    vi.mocked(DatabaseOperations.prototype.saveMetrics).mockResolvedValue();

    const result = await dataProcessingService.processFeature(mockFeatureId);

    expect(result).toEqual({
      confusionMatrix: mockConfusionMatrixResult.confusionMatrix,
      metrics: mockMetrics,
    });
  });

  it('should get metrics for a feature', async () => {
    const mockFeatureId = 1;
    const mockMetrics = [
      { type: 'classification', name: 'Accuracy', value: '90%' },
      { type: 'performance', name: 'Latency', value: '100ms' },
    ];

    vi.mocked(DatabaseOperations.prototype.getMetrics).mockResolvedValue(
      mockMetrics as any,
    );

    const result = await dataProcessingService.getMetrics({
      featureId: mockFeatureId,
    });

    expect(result).toEqual({
      classification: [{ name: 'Accuracy', value: '90%' }],
      performance: [{ name: 'Latency', value: '100ms' }],
    });
  });

  it('should get metrics with timestamp for a feature', async () => {
    const mockFeatureId = 1;
    const mockMetrics = [
      { type: 'classification', name: 'Accuracy', value: '90%' },
      { type: 'performance', name: 'Latency', value: '100ms' },
    ];
    const mockLastUpdated = new Date();

    vi.mocked(DatabaseOperations.prototype.getMetrics).mockResolvedValue(
      mockMetrics as any,
    );
    vi.mocked(
      DatabaseOperations.prototype.getLastMetricTimestamp,
    ).mockResolvedValue(mockLastUpdated);

    const result = await dataProcessingService.getMetricsWithTimestamp({
      featureId: mockFeatureId,
    });

    expect(result).toEqual({
      metrics: {
        classification: [{ name: 'Accuracy', value: '90%' }],
        performance: [{ name: 'Latency', value: '100ms' }],
      },
      lastUpdated: mockLastUpdated,
    });
  });
});
