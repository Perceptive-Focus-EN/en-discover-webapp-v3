import { HealthStatus } from "../Shared/types";

import { 
    DataPoint, 
    SeriesType, 
    AxisType, 
    StackOffsetType, 
    ChartLayoutType 
  } from './types';
  import { ChartType } from '../DataTypes';
  import { MapConfig } from '../Data/Map';


  export interface SeriesConfig {
    name: string;
    type?: SeriesType;
    dataKey: string;
    color?: string;
    yAxisId?: 'left' | 'right';
    stackId?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    dot?: boolean | object;
    activeDot?: boolean | object;
    label?: string | object | React.ReactNode;
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    hide?: boolean;
    connectNulls?: boolean;
    unit?: string;
    formatter?: (value: any, name?: string, props?: any) => string;
    }

export interface AxisConfig {
    type?: AxisType;
    dataKey?: string;
    domain?: [number | string, number | string];
    tickFormatter?: (value: any) => string;
    [key: string]: any;
  }

export interface ReferenceLineConfig {
  x?: number | string;
  y?: number | string;
  stroke?: string;
  label?: string;
  [key: string]: any;
}

export interface ReferenceDotConfig {
  x: number | string;
  y: number | string;
  r?: number;
  fill?: string;
  [key: string]: any;
}

export interface ReferenceAreaConfig {
  x1: number | string;
  x2: number | string;
  y1: number | string;
  y2: number | string;
  fill?: string;
  [key: string]: any;
}

export interface ChartMargin {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }

  export interface ChartData {
    type: ChartType;
    data: DataPoint[];
    title?: string;
    dataKeys?: string[];
    xAxisKey?: string;
    yAxisKey?: string;
    series?: SeriesConfig[];
    forecastData?: DataPoint[];
    correlations?: { [key: string]: number };
    customConfig?: {
      [key: string]: any;
    };
    mapConfig?: MapConfig;
    margin?: ChartMargin;
    width?: string | number;
    height?: string | number;
    stackOffset?: StackOffsetType;
    barCategoryGap?: string | number;
    barGap?: string | number;
    layout?: ChartLayoutType;
    syncId?: string;
    compact?: boolean;
    xAxis?: AxisConfig;
    yAxis?: AxisConfig;
    brush?: {
        dataKey: string;
        height?: number;
        stroke?: string;
        [key: string]: any;
    };
    referenceLines?: ReferenceLineConfig[];
    referenceDots?: ReferenceDotConfig[];
    referenceAreas?: ReferenceAreaConfig[];
    children?: React.ReactNode;
}

export interface FinancialChartData extends ChartData {
  type: ChartType;
  highDataKey?: string;
  lowDataKey?: string;
  openDataKey?: string;
  closeDataKey?: string;
}

export interface AnalyzedChartData {
  suggestedChartType: ChartType;
  dataPointCount: number;
  average: number;
  min: number;
  max: number;
  median?: number;
  standardDeviation?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

export interface ChartStatistics {
  mean?: number;
  median?: number;
  standardDeviation?: number;
  correlation?: number;
  variance?: number;
  [key: string]: number | undefined;
}

export interface AIGeneratedChartData {
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


export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    lastChecked: string;
    services: {
        [key: string]: {
            status: 'up' | 'down';
            responseTime: number;
        };
    };
}

export interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  lastChecked: string;
}

export interface AnalyticsData {
 activeUsers: number;
 totalUsers: number;
 averageOnboardingTime: number;
 mostUsedFeatures: { name: string; usage: number }
 userActivity: { date: string; count: number }[];
 tenantActivity: { date: string; count: number }[]
 revenue: { date: string; amount: number }[];
 growthRate: number;
}

export interface GlobalStats {
 totalTenants: number;
 activeTenants: number;
 totalUsers: number;
 activeUsers: number;
 averageUptime: number;
 totalRequests: number;
 totalTransactions: number;
 revenueThisMonth: number;
 growthRate: number;
 database: number;
 storage: number;
 function: number;
}

export interface RegionalData {
 region: string;
 tenants: number;
 users: number;
 uptime: number;
 responseTime: number;
 requests: number;
 transactions: number;
 revenue: number;
}


export interface SystemHealthOverview {
  dns: HealthStatus;
  certificates: HealthStatus;
  messageQueue: HealthStatus;
  database: HealthStatus;
  storage: HealthStatus;
  // Additional metrics...
}
