import { ChartType, BaseAIResponse, Statistics} from './index';
import { ChartData, SeriesConfig } from './DataTypes';

import { FeatureCollection } from 'geojson';

// Financial Types
export type FinancialEntityType = 'for-profit' | 'non-profit' | 'fintech';

export type FinancialMetricType =
  | 'revenue' | 'expenses' | 'profit' | 'cash-flow' | 'assets' | 'liabilities'
  | 'equity' | 'roi' | 'liquidity' | 'solvency' | 'efficiency' | 'profitability'
  | 'market-share' | 'customer-acquisition-cost' | 'customer-lifetime-value'
  | 'burn-rate' | 'runway' | 'transaction-volume' | 'active-users' | 'donations'
  | 'grants' | 'program-expenses' | 'fundraising-efficiency' | 'donor-retention-rate'
  | 'grant-success-rate' | 'program-expense-ratio' | 'fundraising-ratio'
  | 'program-expense-growth' | 'fundraising-growth';

export interface FinancialDataPoint {
  [key: string]: string | number | undefined;
  date: string;
  revenue?: number;
  expenses?: number;
  profit?: number;
}

export interface FinancialDashboardData {
  [key: string]: FinancialChartData;
}

// Extend ChartType with financial-specific chart types
export type FinancialChartType = ChartType | 'waterfall' | 'candlestick';

// Extend SeriesConfig with financial-specific properties
export interface FinancialSeries extends Omit<SeriesConfig, 'type'> {
  type?: 'line' | 'bar' | 'area' | 'scatter' | 'candlestick';
  stack?: string;
  color?: string;
  highDataKey?: string;
  lowDataKey?: string;
  openDataKey?: string;
  closeDataKey?: string;
  fill?: boolean | string;
  stroke?: string;
  strokeWidth?: number;
  dataKey: string;
}


export interface FinancialChartData extends Omit<ChartData, 'type' | 'data'> {
  type: FinancialChartType;
  data: FinancialDataPoint[];
  series: FinancialSeries[];
  additionalInfo?: {
    yAxisLabel?: string;
    toolTipFormatter?: (value: number, name?: string) => string;
    maxValue?: number;
    fillColor?: string;
    stacked?: boolean;
  };
}

// AI Inference Types
export interface FinancialInsight {
  metric: FinancialMetricType;
  trend: 'up' | 'down' | 'stable';
  value: number;
  changePercentage: number;
  description: string;
}

export interface FinancialRatios {
  currentRatio?: number;
  quickRatio?: number;
  debtToEquityRatio?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  grossProfitMargin?: number;
  netProfitMargin?: number;
  [key: string]: number | undefined;
}

export interface FinancialForecast {
  metric: FinancialMetricType;
  forecastPeriod: string;
  forecastValue: number;
  confidenceInterval: [number, number];
}

export interface FinancialRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  mitigationStrategies: string[];
}

export interface AIGeneratedChart extends FinancialChartData {
  explanation: string;
}

export interface FinancialAIResponse extends BaseAIResponse {
  summary: string;
  keyInsights: FinancialInsight[];
  detailedAnalysis: string;
  financialHealth: {
    overview: string;
    ratios: FinancialRatios;
  };
  forecasts: FinancialForecast[];
  riskAssessment: FinancialRiskAssessment;
  recommendations: string[];
  aiGeneratedChart?: AIGeneratedChart;
  statistics: Statistics;
}

export interface FinancialAIRequest {
  query: string;
  entityType: FinancialEntityType;
  financialData: FinancialDashboardData;
  timeRange?: {
    start: string;
    end: string;
  };
  specificMetrics?: FinancialMetricType[];
}

export type FinancialAIInsightType = 'trend' | 'anomaly' | 'forecast';

export interface BaseFinancialAIInsight {
  type: FinancialAIInsightType;
}

export interface TrendInsight extends BaseFinancialAIInsight {
  type: 'trend';
  data: FeatureCollection;
}

export interface AnomalyInsight extends BaseFinancialAIInsight {
  type: 'anomaly';
  data: FeatureCollection;
}

export interface ForecastInsight extends BaseFinancialAIInsight {
  type: 'forecast';
  data: FinancialForecast[];
}

export type FinancialAIInsight = TrendInsight | AnomalyInsight | ForecastInsight;

export interface FinancialParsedResult {
  summary: string;
  keyInsights: string[];
  detailedAnalysis: string;
  chartData: FinancialChartData | null;
  insights: FinancialAIInsight[];
}