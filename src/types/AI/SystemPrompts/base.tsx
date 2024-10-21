// src/types/Dashboard/AI/base.ts
import { ChartType } from '../../DataTypes';
// import { DataPoint } from '../../Data/types';

export interface BaseAIRequest {
  prompt: string;
  context?: any;
}

export interface BaseAIResponse {
  generatedContent: any;
  metadata: {
    promptUsed: string;
    generationTimestamp: string;
    modelVersion: string;
  };
}

export interface BaseChartAIConfig {
  supportedChartTypes: ChartType[];
  dataPointLimit: number;
  statisticalCapabilities: string[];
  insightGenerationCapabilities: string[];
}
