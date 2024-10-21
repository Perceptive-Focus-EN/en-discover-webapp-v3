import { FeatureCollection } from "geojson";
import { FinancialForecast, FinancialChartData } from "./finance";
import { DesignObject } from "./design";
import { ChartData, ChartType } from './DataTypes';


// AI Insight Types
export type AIInsightType = 'heatmap' | 'cluster' | 'highlight' | 'trend' | 'anomaly' | 'forecast' | 'standard';

// Updated to use AnalysisContextType
export type AnalysisContextType = 'general' | 'marketing' | 'financial';

export interface AIAnalysisProps {
  currentChartData: ChartData | FinancialChartData;
  onChartUpdate: (newChartData: ChartData | FinancialChartData) => void;
  contextType: AnalysisContextType; // Updated to use AnalysisContextType
}

export interface BaseAIInsight {
  type: AIInsightType;
  description: string; // Added description to base interface
  confidence?: number; // Added optional confidence
  impact?: string; // Added optional impact
}

// Updated all insight interfaces to extend BaseAIInsight
export interface StandardAIInsight extends BaseAIInsight {
  type: 'standard';
}

export interface HeatmapInsight extends BaseAIInsight {
  type: 'heatmap';
  data: FeatureCollection;
}

export interface ClusterInsight extends BaseAIInsight {
  type: 'cluster';
  data: FeatureCollection;
}

export interface HighlightInsight extends BaseAIInsight {
  type: 'highlight';
  data: string[];
}

export interface TrendInsight extends BaseAIInsight {
  type: 'trend';
  data: FeatureCollection;
}

export interface AnomalyInsight extends BaseAIInsight {
  type: 'anomaly';
  data: FeatureCollection;
}

export interface ForecastInsight extends BaseAIInsight {
  type: 'forecast';
  data: FinancialForecast[];
}

export interface FinancialAIInsight extends BaseAIInsight {
  type: 'trend' | 'anomaly' | 'forecast';
}

export interface DynamicChartProps {
  chartData: ChartData | FinancialChartData;
  showInsights?: boolean;
}

export type AIInsight = StandardAIInsight | HeatmapInsight | ClusterInsight | HighlightInsight | TrendInsight | AnomalyInsight | ForecastInsight | FinancialAIInsight;

// Parsed Result
export interface ParsedResult {
  summary: string;
  keyInsights: string[];
  detailedAnalysis: string;
  chartData: ChartData | FinancialChartData | null;
  insights: AIInsight[];
  mapInsights: AIInsight[];
  vmCommand?: string;
  designSuggestions?: DesignObject[];
  predictions?: any[]; // Changed to any[] for flexibility
  suggestedChartType: ChartType; // Changed to ChartType for consistency
}

// MapBox Component Props
export interface MapboxGLComponentProps {
  campaignMapData: Array<{ country: string; campaigns: number; location: [number, number] }>;
  aiInsights?: ParsedResult | null;
}

// / Added PredefinedPrompt type
export type PredefinedPrompt = string;

