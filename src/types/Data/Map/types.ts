// src/types/Dashboard/Data/Map/types.ts

export type MapType = 'markers' | 'heatmap' | 'cluster' | 'choropleth' | 'bubble';

export type DataSource = 'chartData' | 'census' | 'worldBank' | 'openStreetMap';

export type BoundingBox = [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]

export type ColorScale = string[];

export type RadiusScale = [number, number];

export type Coordinates = [number, number]; // [longitude, latitude]