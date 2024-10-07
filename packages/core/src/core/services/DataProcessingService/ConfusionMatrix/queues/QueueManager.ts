import { Queue } from '../../../../../shared/utils/Queue.js';
import type { Feature } from '../../../../../shared/models/Feature.js';

export class QueueManager {
  private queue: Queue<{
    promptId: number;
    useCaseId: number;
    promptContent: string;
    caseDescription: string;
  }>;

  constructor() {
    this.queue = new Queue();
  }

  initializeQueue(feature: Feature): void {
    let count = 0;
    feature.prompts.forEach((prompt) => {
      const relatedUseCases = feature.useCases.filter(
        (useCase) => useCase.promptId === prompt.id,
      );
      relatedUseCases.forEach((useCase) => {
        if (count < 15) {
          // TODO: Remove limit
          this.queue.enqueue({
            promptId: prompt.id,
            useCaseId: useCase.id,
            promptContent: prompt.content,
            caseDescription: useCase.caseDescription,
          });
          count++;
        }
      });
    });
  }

  dequeue() {
    return this.queue.dequeue();
  }

  isEmpty(): boolean {
    return this.queue.isEmpty();
  }

  size(): number {
    return this.queue.size();
  }
}
