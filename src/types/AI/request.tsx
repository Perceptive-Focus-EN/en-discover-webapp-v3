// src/types/Dashboard/AI/request.ts
import { ChartType } from '../Shared/types';
import { DataPoint } from '../Data/types';

export interface AIChartGenerationRequest {
  prompt: string;
  currentData?: DataPoint[];
  preferredChartType?: ChartType;
  dataConstraints?: {
    minDataPoints?: number;
    maxDataPoints?: number;
    requiredFields?: string[];
  };
  statisticalRequirements?: string[];
  insightRequirements?: {
    count: number;
    focusAreas?: string[];
  };
}