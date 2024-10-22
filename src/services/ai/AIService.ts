// src/services/ai/AIService.ts

export interface AIService {
  generateText(prompt: string): Promise<string>;
}