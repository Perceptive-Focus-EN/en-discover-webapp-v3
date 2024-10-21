
// src/types/index.ts

import { SeriesConfig } from "./DataTypes";

// Enums
export enum EmployeeCount {
  OneToTen = "1-10",
  ElevenToFifty = "11-50",
  FiftyOneToTwoHundred = "51-200",
  TwoHundredOneToFiveHundred = "201-500",
  FiveHundredPlus = "500+",
}

export enum AnnualRevenue {
  LessThanHundredK = "0-100k",
  HundredKToFiveHundredK = "100k-500k",
  FiveHundredKToOneMillion = "500k-1m",
  OneMillionToFiveMillion = "1m-5m",
  FiveMillionPlus = "5m+",
  ZeroToTenThousand = "ZeroToTenThousand",
  Other = "Other",
}

export enum Goals {
  IncreaseRevenue = "Increase revenue",
  ReduceCosts = "Reduce costs",
  ImproveCustomerSatisfaction = "Improve customer satisfaction",
  IncreaseMarketShare = "Increase market share",
  ImproveProductivity = "Improve productivity",
  Other = "Other",
}

// API-related interfaces
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Tab Panel Props
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}


export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

// Chart-related types
// src/types/index.ts

import React from 'react';

export interface FinancialSeries extends SeriesConfig {
  highDataKey?: string;
  lowDataKey?: string;
  openDataKey?: string;
  closeDataKey?: string;
}

// Updated Chart Types
export type ChartType = 
'line' 
| 'multiLine' 
| 'bar' 
| 'stackedBar' 
| 'pie' 
| 'scatter' 
| 'area' 
| 'composed' 
| 'radar' 
| 'map' 
| 'bubble' 
| 'treemap' 
| 'advancedSalesExpenses'
| 'ohlc'
| 'candlestick'
| 'waterfall'
| 'heatmap'
| 'cluster'
| 'highlight'
| 'forecast'
| 'trend'
| 'funnel'
| 'sankey'
| '3dScatter'
| '3dSurface'
| 'boxplot'
| 'waterfall'

;
export type FinancialChartType = ChartType | 'candlestick' | 'ohlc' | 'waterfall';
export type ExtendedChartType = 
  | ChartType
  | FinancialChartType
  | 'heatmap'
  | 'cluster'
  | 'highlight'
  | 'forecast'
  | 'trend'
  | 'treemap'
  | 'boxplot'
  | 'funnel'
  | 'sankey'
  | '3dScatter'
  | '3dSurface'
    'streamgraph'
    'chord'
    'network'
  ;


// Updated FinancialChartData


export interface AnalyzedData {
  suggestedChartType: ExtendedChartType;
  dataPointCount: number;
  average: number;
  min: number;
  max: number;
  median?: number;
  standardDeviation?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface Statistics {
  mean?: number;
  median?: number;
  standardDeviation?: number;
  correlation?: number;
  variance?: number;
  [key: string]: number | undefined;
}

export interface BaseAIResponse {
  text: string;
  data: {
    chartData: { name: string; value: number }[];
    chartType: ChartType;
    statistics: {
      mean: number;
      standardDeviation: number;
      variance: number;
    };
    insights: string[];
  };
}


