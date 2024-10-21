// src/types/WorldBank/response.ts

import { WorldBankPaginationInfo, WorldBankTopic } from './base';

export interface WorldBankIndicator {
  id: string;
  name: string;
  unit: string;
  source: {
    id: string;
    value: string;
  };
  sourceNote: string;
  sourceOrganization: string;
  topics: WorldBankTopic[];
}

export type WorldBankIndicatorResponse = [
  WorldBankPaginationInfo,
  WorldBankIndicator[]
];

export interface WorldBankDataPoint {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

export type WorldBankDataResponse = [
  WorldBankPaginationInfo,
  WorldBankDataPoint[]
];

export interface ProcessedWorldBankData {
  indicators: string[];
  countries: string[];
  years: number[];
  data: WorldBankDataPoint[];
}