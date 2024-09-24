import { describe, it, expect, vi, beforeEach, afterEach, afterAll, beforeAll } from 'vitest';
import { AIModelService } from '../AIModelService.js';
import { getDB } from '../../../shared/utils/Database.js';
import { migrateDB } from '../../../shared/utils/migrateDatabase.js';
import { sql } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { FeatureService } from '../FeatureService.js';

vi.mock('../../../shared/utils/Database.js', async (importOriginal) => {
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const client = neon('postgresql://flymapsdb_owner:wi9VNOBT0kDx@ep-raspy-bonus-a50kyoxq.us-east-2.aws.neon.tech/flymapsdb?sslmode=require');
  const db = drizzle(client);
  return {
    ...(await importOriginal<typeof import('../../../shared/utils/Database.js')>()),
    getDB: (neonUrl: string) => db,
  };
});

describe('AIModelService', () => {
  let service: AIModelService;
  let featureId: number;
  let mockDB: NeonHttpDatabase<Record<string, never>>;

  beforeAll(async () => {
    const NEON_URL = 'postgresql://flymapsdb_owner:wi9VNOBT0kDx@ep-raspy-bonus-a50kyoxq.us-east-2.aws.neon.tech/flymapsdb?sslmode=require';
    await migrateDB(NEON_URL);
    let featureService = new FeatureService(NEON_URL);
    const feature = await featureService.createFeature({
      name: 'Test feature',
      description: 'Test feature description',
      model: 'Test model',
      url: 'Test url',
    });
    featureId = feature.id;
    service = new AIModelService(NEON_URL);
    mockDB = getDB(NEON_URL);

  });

  afterAll(async () => {
   await mockDB.execute(sql`drop schema if exists public cascade`);
   await mockDB.execute(sql`create schema public`);
   await mockDB.execute(sql`drop schema if exists drizzle cascade`);
  });

  it('should save a new AIPrompt', async () => {
    const promptData = 'Test prompt';
    const result = await service.saveAIPrompt(promptData, featureId);
    expect(result).toEqual({ id: 1, stringsIds: [1, 2, 3], featureId: featureId, createdAt: expect.any(Date) });
  });

  it('should throw an error when saving AIPrompt with invalid featureId', async () => {
    const promptData = 'Test prompt';
    const featureIdFake = -1;

    await expect(service.saveAIPrompt(promptData, featureIdFake)).rejects.toThrow();
  });

  it('should read an AIPrompt by ID', async () => {
    const promptId = 1;

    const result = await service.readAIPrompt(promptId);
    expect(result).toBeDefined();
  });

  it('should throw an error when reading a non-existent AIPrompt', async () => {
    const promptId = 999; // ID que no existe

    await expect(service.readAIPrompt(promptId)).rejects.toThrow('Prompt not found');
  });

  it('should get prompts by featureId', async () => {
    const result = await service.getPromptsByFeatureId(featureId);
    expect(result).toHaveLength(1);
  });

  it('should return an empty array if no prompts found by featureId', async () => {
    const featureIdFake = 999; // ID que no existe

    const result = await service.getPromptsByFeatureId(featureIdFake);
    expect(result).toEqual([]);
  });

  it('should save a new AIResponse', async () => {
    const responseData = 'Test response';
    const promptIdFake = 1;

    const result = await service.saveAIResponse(responseData, promptIdFake);
    expect(result).toEqual({ id: 1, stringsIds: [1, 2, 4], promptId: promptIdFake, createdAt: expect.any(Date) });
  });

  it('should throw an error when saving AIResponse with invalid promptId', async () => {
    const responseData = 'Test response';
    const promptIdFake = -1; // Invalid promptId

    await expect(service.saveAIResponse(responseData, promptIdFake)).rejects.toThrow();
  });

  it('should read an AIResponse by ID', async () => {
    const responseId = 1;

    const result = await service.readAIResponse(responseId);
    expect(result).toBeDefined();
  });

  it('should throw an error when reading a non-existent AIResponse', async () => {
    const responseId = 999; // ID que no existe

    await expect(service.readAIResponse(responseId)).rejects.toThrow('Response not found');
  });

  it('should save AIInteraction with both prompt and response', async () => {
    const promptData = 'Test prompt';
    const responseData = 'Test response';

    const result = await service.saveAIInteraction(promptData, responseData, featureId);
    expect(result).toEqual({ promptId: 3, responseId: 3 });
  });

  it('should warn when saving AIInteraction without prompt', async () => {
    const responseData = 'Test response';
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await service.saveAIInteraction(undefined, responseData, featureId);
    expect(result).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith('No se puede guardar una respuesta sin un prompt asociado');

    consoleWarnSpy.mockRestore();
  });
});