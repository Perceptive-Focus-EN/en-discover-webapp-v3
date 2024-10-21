import { WorldBankConfig } from './MapData/WorldBankIndicatorRequest';

export type ChartType = 'line' | 'bar' | 'pie' | 'map' | 'area' | 'radar' | '3dScatter' |'3dSurface'| 'boxplot'| 'forecast' | 'sankey' | 'advancedSalesExpenses' | 'trend' |'candlestick' | 'highlight' |'multiLine' | 'ohlc' | 'stackedBar' |'bubble' | 'composed' |'funnel' | 'waterfall' | 'scatter' | 'treemap' | 'heatmap' | 'cluster' | 'trend' | 'forecast';
export type VisualizationType = 'map' | 'chart' | 'heatmap' | 'cluster' | 'choropleth' | 'bubble';
export type MapType = 'markers' | 'heatmap' | 'cluster' | 'choropleth' | 'bubble';
export type DataSource = 'chartData' | 'census' | 'worldBank' | 'openStreetMap';

// Extend DataPoint to include geographical data
export type DataPoint = {
  // Existing properties
  month?: string;
  sales?: number;
  expenses?: number;
  customers?: number;
  profit?: number;
  group?: number;

  // Geographical properties
  latitude?: number;
  longitude?: number;
  name?: string;
  country?: string;
  state?: string;
  city?: string;

  // Generic value property
  value?: number;

  // Census-specific properties
  population?: number;
  medianIncome?: number;
  housingUnits?: number;

  // World Bank specific properties
  indicator?: string;
  indicatorValue?: number;
  year?: number;

  // OpenStreetMap specific properties
  amenity?: string;
  category?: string;
  osmId?: number;

  // Additional useful properties
  id?: string | number;
  color?: string;
  size?: number;
  weight?: number;

  // Maintain flexibility
  [key: string]: any;
};

export type Pagination = {
  page?: number;
  perPage?: number;
  pageSize?: number;
  total?: number;
};

export type CensusConfig = {
  endpoint: string;
  getParams: string[];
  forClause: string;
  year: string;
  stateIndex: number; // Add the 'stateIndex' property
};


export type OpenStreetMapConfig = {
  query: string;
  boundingBox: [number, number, number, number];
  timeout?: number;
  maxElements?: number;
};

export interface MapOptions {
  mapType: MapType;
  dataSource: DataSource;
}

export type MapConfig = {
  mapType: MapType;
  dataSource: DataSource;
  censusConfig?: CensusConfig;
  worldBankConfig?: WorldBankConfig;
  openStreetMapConfig?: OpenStreetMapConfig;
  colorScale?: string[];
  minColor?: string;
  maxColor?: string;
  radiusScale?: [number, number];
  clusterRadius?: number;
  heatmapIntensity?: number;
  heatmapRadius?: number;
  choroplethProperty?: string;
  bubbleProperty?: string;
  clusterProperties?: string[];
  tooltipProperties?: string[];
  visualizationType: VisualizationType;
  center?: [number, number];
  zoom?: number;
};


// Define the main ChartData interface with flexibility for different chart types
export interface SeriesConfig {
    name: string;
    type?: 'line' | 'bar' | 'area' | 'scatter';
    dataKey: string;
    color?: string;
    yAxisId?: 'left' | 'right';
    stackId?: string;
    stack?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    dot?: boolean | object;
    activeDot?: boolean | object;
    label?: string | object | React.ReactNode;
    legendType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye' | 'none';
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    hide?: boolean;
    connectNulls?: boolean;
    unit?: string;
    xAxisId?: string | number;
    formatter?: (value: any, name?: string, props?: any) => string;
    [key: string]: any;
  }
  
  // Define the ChartData interface
  export interface ChartData {
    type: ChartType;
    data: DataPoint[];
    title?: string;
    dataKeys?: string[]; // Keys of the data to be used, useful in dynamic charts
    xAxisKey?: string; // Key for the x-axis data
    yAxisKey?: string; // Key for the y-axis data, if applicable
    series?: SeriesConfig[]; // For multiple series in line/bar charts
    forecastData?: DataPoint[]; // for forecast charts
    correlations?: { [key: string]: number }; // for advanced charts
    customConfig?: {
      treemapColors?: string[];
      heatmapColors?: string[];
      [key: string]: any;
    };
    mapConfig?: MapConfig; // Add this for map-specific configuration
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    width?: string | number;
    height?: string | number;
    stackOffset?: 'expand' | 'none' | 'wiggle' | 'silhouette';
    barCategoryGap?: string | number;
    barGap?: string | number;
    layout?: 'horizontal' | 'vertical';
    syncId?: string;
    compact?: boolean;
    xAxis?: {
      type?: 'number' | 'category';
      dataKey?: string;
      domain?: [number | string, number | string];
      tickFormatter?: (value: any) => string;
      [key: string]: any;
    };
    yAxis?: {
      type?: 'number' | 'category';
      dataKey?: string;
      domain?: [number | string, number | string];
      tickFormatter?: (value: any) => string;
      [key: string]: any;
    };
    brush?: {
      dataKey: string;
      height?: number;
      stroke?: string;
      [key: string]: any;
    };
    referenceLines?: Array<{
      x?: number | string;
      y?: number | string;
      stroke?: string;
      label?: string;
      [key: string]: any;
    }>;
    referenceDots?: Array<{
      x: number | string;
      y: number | string;
      r?: number;
      fill?: string;
      [key: string]: any;
    }>;
    referenceAreas?: Array<{
      x1: number | string;
      x2: number | string;
      y1: number | string;
      y2: number | string;
      fill?: string;
      [key: string]: any;
    }>;
    children?: React.ReactNode;
    [key: string]: any;
  }




  export type CustomChartProps = {
    data: ChartData[];
  };
  
  export type ClusterChartProps = {
    data: { id: string; group: number }[];
  };
  
  export type TrendDataPoint = {
    date: string;
    value: number;
  };
  
  export type TrendChartProps = {
    data: TrendDataPoint[];
  };
  
  export type ForecastChartProps = {
    data: ChartData[];
    forecastData: ChartData[];
  };

  export type MapChartProps = {
    data: DataPoint[];
    config: MapConfig;
  };

  export type VisualizationProps = {
    data: ChartData[];
    config: MapConfig;
  };

