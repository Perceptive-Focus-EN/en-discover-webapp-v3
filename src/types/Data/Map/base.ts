// src/types/Dashboard/Data/Map/base.ts
import { MapType, DataSource, BoundingBox } from './types';

export interface OpenStreetMapConfig {
  query: string;
  boundingBox: BoundingBox;
  timeout?: number;
  maxElements?: number;
}

export interface MapOptions {
  mapType: MapType;
  dataSource: DataSource;
}
