// src/services/ai/AIServiceFactory.ts

import { AIService } from './AIService';
import { OpenAIService } from './OpenAIService';
import { ClaudeAIService } from './ClaudeAIService';
import { logger } from '../../MonitoringSystem/Loggers/logger';

export type AIServiceType = 'openai' | 'claude';

export class AIServiceFactory {
  static createService(type: AIServiceType, apiKey: string): AIService {
    logger.info(`Creating AI service of type: ${type}`);
    
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

