import type { InsertConfusionMatrix } from '../../../../../shared/models/ConfusionMatrix.js';

export interface ProcessedCase {
  promptId: number;
  useCaseId: number;
  generatedResponse: string;
}

export interface WorkerMessage {
  type: 'PROCESSED_CASES' | 'CONFUSION_MATRIX';
  data: ProcessedCase[] | InsertConfusionMatrix[];
}
