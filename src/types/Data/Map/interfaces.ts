// src/types/Dashboard/Data/Map/interfaces.ts
import { MapType, DataSource, ColorScale, RadiusScale, Coordinates } from './types';
import { MapOptions, OpenStreetMapConfig } from './base';
import { CensusConfig } from './Census/interfaces';
import { WorldBankConfig } from './WorldBank';

export interface MapConfig extends MapOptions {
  censusConfig?: CensusConfig;
  worldBankConfig?: WorldBankConfig;
  openStreetMapConfig?: OpenStreetMapConfig;
  colorScale?: ColorScale;
  minColor?: string;
  maxColor?: string;
  radiusScale?: RadiusScale;
  clusterRadius?: number;
  heatmapIntensity?: number;
  heatmapRadius?: number;
  choroplethProperty?: string;
  bubbleProperty?: string;
  clusterProperties?: string[];
  tooltipProperties?: string[];
  center?: Coordinates;
  zoom?: number;
}