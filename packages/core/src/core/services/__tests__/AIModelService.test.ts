import { describe, it, vi, expect, beforeAll } from 'vitest';
import { AIModelService } from '../AIModelService.js';
import { FeatureService } from '../FeatureService.js';

describe('AIModelService', () => {
  let service: AIModelService;
  let featureId: number;
  const NEON_URL = process.env.NEON_TEST_URL!;

  beforeAll(async () => {
    let featureService = new FeatureService(NEON_URL);
    const feature = await featureService.createFeature({
      name: 'Test feature',
      description: 'Test feature description',
      model: 'Test model',
      url: 'Test url',
    });
    featureId = feature.id;
    service = new AIModelService(NEON_URL);
  });

  it('should save a new AIPrompt', async () => {
    const promptData = 'Test prompt';
    const result = await service.saveAIPrompt(promptData, featureId);
    expect(result.id).toBeTypeOf('number');
    expect(result.stringsIds).toHaveLength(3);
    expect(result.featureId).toBe(featureId);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw an error when saving AIPrompt with invalid featureId', async () => {
    const promptData = 'Test prompt';
    const featureIdFake = -1;

    await expect(
      service.saveAIPrompt(promptData, featureIdFake),
    ).rejects.toThrow();
  });

  it('should read an AIPrompt by ID', async () => {
    const promptId = 1;

    const result = await service.readAIPrompt(promptId);
    expect(result).toBeDefined();
  });

  it('should throw an error when reading a non-existent AIPrompt', async () => {
    const promptId = 999; // ID que no existe

    await expect(service.readAIPrompt(promptId)).rejects.toThrow(
      'Prompt not found',
    );
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
    expect(result.id).toBeTypeOf('number');
    expect(result.stringsIds).toHaveLength(3);
    expect(result.promptId).toBe(promptIdFake);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should throw an error when saving AIResponse with invalid promptId', async () => {
    const responseData = 'Test response';
    const promptIdFake = -1; // Invalid promptId

    await expect(
      service.saveAIResponse(responseData, promptIdFake),
    ).rejects.toThrow();
  });

  it('should read an AIResponse by ID', async () => {
    const responseId = 1;

    const result = await service.readAIResponse(responseId);
    expect(result).toBeDefined();
  });

  it('should throw an error when reading a non-existent AIResponse', async () => {
    const responseId = 999; //Not existing response id

    await expect(service.readAIResponse(responseId)).rejects.toThrow(
      'Response not found',
    );
  });

  it('should save AIInteraction with both prompt and response', async () => {
    const promptData = 'Test prompt';
    const responseData = 'Test response';

    const result = await service.saveAIInteraction(
      promptData,
      responseData,
      featureId,
    );
    expect(result).toEqual({
      promptId: expect.any(Number),
      responseId: expect.any(Number),
    });
  });

  it('should warn when saving AIInteraction without prompt', async () => {
    const responseData = 'Test response';
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const result = await service.saveAIInteraction(
      undefined,
      responseData,
      featureId,
    );
    expect(result).toEqual({});
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'No se puede guardar una respuesta sin un prompt asociado',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should delete a prompt without associated responses', async () => {
    // Crear un nuevo prompt sin respuestas asociadas
    const promptData = 'Prompt to delete';
    const newPrompt = await service.saveAIPrompt(promptData, featureId);

    const result = await service.deleteAIPrompt(newPrompt.id);
    expect(result).toEqual({
      success: true,
      message: 'The prompt was deleted correctly.',
    });
  });

  it('should not delete a prompt with associated responses', async () => {
    const promptData = 'Prompt with response';
    const prompt = await service.saveAIPrompt(promptData, featureId);
    await service.saveAIResponse('Associated response', prompt.id);

    const result = await service.deleteAIPrompt(prompt.id);
    expect(result).toEqual({
      success: false,
      message: 'Cannot delete the prompt because it has associated responses.',
    });
  });

  it('should handle attempt to delete a non-existent prompt', async () => {
    const nonExistentPromptId = 99999;
    const result = await service.deleteAIPrompt(nonExistentPromptId);
    expect(result).toEqual({
      success: false,
      message: 'The prompt specified was not found.',
    });
  });
});
