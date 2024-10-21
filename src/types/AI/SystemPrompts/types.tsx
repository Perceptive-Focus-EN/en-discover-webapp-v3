// src/types/Dashboard/AI/SystemPrompt/types.ts
export type PromptType = 'chart_generation' | 'data_analysis' | 'insight_generation';

export interface SystemPromptConfig {
  type: PromptType;
  basePrompt: string;
  parameters: {
    [key: string]: string | number | boolean;
  };
  constraints: string[];
  examples: {
    input: string;
    output: string;
  }[];
}