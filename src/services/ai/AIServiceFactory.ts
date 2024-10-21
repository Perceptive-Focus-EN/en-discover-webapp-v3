// src/services/ai/AIServiceFactory.ts

// import { AIService } from './AIService';
// import { OpenAIService } from './OpenAIService';
// import { ClaudeAIService } from './ClaudeAIService';
// import { logger } from '../../utils/ErrorHandling/logger';
// import { UnsupportedAIServiceError } from '../../errors/errors';

// export type AIServiceType = 'openai' | 'claude';

// export class AIServiceFactory {
//   static createService(type: AIServiceType, apiKey: string): AIService {
//     logger.info(`Creating AI service of type: ${type}`);
    
//     try {
//       switch (type) {
//         case 'openai':
//           return new OpenAIService(apiKey);
//         case 'claude':
//           return new ClaudeAIService(apiKey);
//         default:
//           throw new UnsupportedAIServiceError(`Unsupported AI service type: ${type}`);
//       }
//     } catch (error) {
//       logger.error(`Error creating AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
//       throw error;
//     }
//   }
// }

// You'll need to implement OpenAIService and ClaudeAIService classes
// that implement the AIService interface
