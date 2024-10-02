import { describe } from 'vitest';

describe.sequential('DataProcessingService Tests', () => {
  describe('FeatureDataLoader', async () => {
    await import('./FeatureDataLoader.it.js');
  });

  //describe('ConfusionMatrixGenerator', async () => {
  //  await import('./ConfusionMatrixGenerator.test.js');
  //});

  //describe('DatabaseOperations', async () => {
  //  await import('./DatabaseOperations.test.js');
  //});

  //describe('MetricsCalculator', async () => {
  //  await import('./MetricsCalculator.test.js');
  //});

  describe('DataProcessingService', async () => {
    await import('./index.it.js');
  });
});
