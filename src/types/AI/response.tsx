// src/types/Dashboard/AI/response.ts
import { ChartType } from '../Shared/types';
import { DataPoint } from '../Data/types';

export interface AIGeneratedChartData {
  text: string;
  data: {
    chartData: DataPoint[];
    chartType: ChartType;
    statistics: {
      mean: number;
      median?: number;
      standardDeviation: number;
      variance: number;
      min?: number;
      max?: number;
      [key: string]: number | undefined;
    };
    insights: string[];
    projections?: DataPoint[];
    confidenceInterval?: {
      lower: DataPoint[];
      upper: DataPoint[];
    };
  };
  metadata: {
    promptUsed: string;
    generationTimestamp: string;
    modelVersion: string;
  };
}