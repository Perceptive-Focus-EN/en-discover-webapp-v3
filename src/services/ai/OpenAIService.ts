// src/services/ai/OpenAIService.ts

import { AIService } from './AIService';
import axios from 'axios';
import { logger } from '../../utils/ErrorHandling/logger';

export class OpenAIService implements AIService {
  private apiKey: string;
  private apiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          prompt: prompt,
          max_tokens: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].text.trim();
    } catch (error) {
      logger.error(new Error('Error generating text with OpenAI'), { error });
      throw new Error('Failed to generate text with OpenAI');
    }
  }
}