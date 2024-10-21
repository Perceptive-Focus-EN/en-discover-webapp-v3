// src/types/marketing.ts

import { Feature, Point, FeatureCollection } from 'geojson';
import { BaseAIResponse, ChartType } from './index';
import { ChartData } from './DataTypes';
import { FinancialChartData } from './finance';
import { DesignObject } from './design';
import { ExtendedChartType } from './index';


export interface CampaignData {
  id: string;
  name: string;
  location: [number, number];
  campaign: string;
  signups: number;
  revenue: number;
  cost: number;
}


export interface CampaignProperties {
  id: string;
  name: string;
  signups: number;
  revenue: number;
  cost: number;
}

export type CampaignFeature = Feature<Point, CampaignProperties>;

export interface MarketingChartData extends Omit<ChartData, 'type' | 'data'> {
  type: ChartType 
  | ExtendedChartType 
  | "candlestick" 
  | "waterfall" 
  | "heatmap" 
  | "treemap" 
  | "funnel" 
  | "sankey" 
  | "3dScatter" 
  | "3dSurface"
  | "boxplot"
  | "radar"
  | "map" 
  | "multiLine"
  | "stackedBar"
  | "pie"
  | "composed"
  | "scatter"
  | "area"
  | "bar"
  | "line"
  | "ohlc"
  | "candlestick"; // Add "candlestick" to the type
  data: CampaignData[];
  dataKeys: string[];
  title: string;
  additionalInfo?: {
    yAxisLabel?: string;
    toolTipFormatter?: (value: number, name?: string) => string;
    maxValue?: number;
    fillColor?: string;
    stacked?: boolean;
  };
}

export interface MarketingDashboardData extends Record<string, MarketingChartData> {
  campaignPerformance: MarketingChartData;
  customerEngagement: MarketingChartData;
  conversionRates: MarketingChartData;
  campaignMap: MarketingChartData;
}

export interface CampaignPerformanceData {
  campaign: string;
  signups: number;
  revenue: number;
  cost: number;
}

export interface MarketingAIResponse extends BaseAIResponse {
  data: BaseAIResponse['data'] & {
    campaignInsights?: string[];
    topPerformingCampaigns?: CampaignData[];
  };
}
