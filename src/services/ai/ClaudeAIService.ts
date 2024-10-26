// src/services/ai/ClaudeAIService.ts

import { AIService } from './AIService';
import axios from 'axios';

export class ClaudeAIService implements AIService {
  private apiKey: string;
  private apiUrl = 'https://api.anthropic.com/v1/complete';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          prompt: prompt,
          model: 'claude-v1',
          max_tokens_to_sample: 100,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.completion.trim();
    } catch (error) {
      throw error;
    }
  }
}