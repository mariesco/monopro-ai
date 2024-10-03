export type GoogleAIMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
};

export interface AIModelInterface {
  generateObject<T>(params: {
    schema: any;
    messages: GoogleAIMessage[];
    temperature: number;
  }): Promise<{ object: T }>;
}
