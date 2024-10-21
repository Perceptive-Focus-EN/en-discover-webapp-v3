
export type DataPointValue = number | string | null;

export type DataPoint = {
  [key: string]: DataPointValue;
};

export type SeriesType = 'line' | 'bar' | 'area' | 'scatter';

export type AxisType = 'number' | 'category' | 'time';

export type StackOffsetType = 'expand' | 'none' | 'wiggle' | 'silhouette';

export type ChartLayoutType = 'horizontal' | 'vertical';