// src/services/ai/AIServiceFactory.ts

import { AIService } from './AIService';
import { OpenAIService } from './OpenAIService';
import { ClaudeAIService } from './ClaudeAIService';

export type AIServiceType = 'openai' | 'claude';

export class AIServiceFactory {
  static createService(type: AIServiceType, apiKey: string): AIService {

    try {
      switch (type) {
        case 'openai':
          return new OpenAIService(apiKey);
        case 'claude':
          return new ClaudeAIService(apiKey);
        default:
          throw new Error(`Unsupported AI service type: ${type}`);
      }
    } catch (error) {
      throw error;
    }
  }
}

