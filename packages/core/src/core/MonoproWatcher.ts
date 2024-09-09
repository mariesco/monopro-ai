import { FeatureService } from './services/FeatureService.js';
import { AIModelService } from './services/AIModelService.js';
import { performance } from 'perf_hooks';

export class MonoproWatcher {
  debug: boolean = false;
  featureService!: FeatureService;
  aiModelService!: AIModelService;
  private startTime: number = 0;
  private responseProcessingTime: number = 0;

  constructor(options?: { debug?: boolean }) {
    this.debug = options?.debug ?? false;
    this.init();
  }

  private async init() {
    this.startTime = performance.now();
    this.featureService = new FeatureService(process.env.NEON_URL!);
    this.aiModelService = new AIModelService(process.env.NEON_URL!);
  }

  private log(message: string, ...args: any[]) {
    if (this.debug) {
      console.log(message, ...args);
    }
  }

  observe({
    prompt,
    response,
  }: {
    prompt: string;
    response: string | undefined;
  }) {
    this.responseProcessingTime = performance.now() - this.startTime;
    this.log(
      `[MonoproWatcher] Tiempo de procesamiento de la respuesta: ${this.responseProcessingTime.toFixed(2)} ms`,
    );

    setImmediate(() => {
      this.observeAsync(prompt, response)
        .catch(console.error)
        .finally(() => {
          const endTime = performance.now();
          const observationTime =
            endTime - (this.startTime + this.responseProcessingTime);
          this.log(
            `[MonoproWatcher] Tiempo de observación: ${observationTime.toFixed(2)} ms`,
          );
          this.log(
            `[MonoproWatcher] Tiempo total de ejecución: ${(endTime - this.startTime).toFixed(2)} ms`,
          );
        });
    });
  }

  private async observeAsync(prompt: string, response: string | undefined) {
    try {
      //TODO: Get featureId from prompt?
      const featureId = 4; // Asumimos un ID de característica por defecto
      if (prompt || (prompt && response)) {
        await this.aiModelService.saveAIInteraction(
          prompt,
          response,
          featureId,
        );
        this.log('[MonoproWatcher] Interacción guardada con éxito');
      } else if (response) {
        this.log(
          '[MonoproWatcher] No se puede guardar una respuesta sin un prompt asociado',
        );
      }
    } catch (error) {
      this.log('[MonoproWatcher] Error al guardar la interacción:', error);
    }
  }
}
