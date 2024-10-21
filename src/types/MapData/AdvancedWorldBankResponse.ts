// Extend the existing WorldBankIndicatorRequest

import { ProcessedWorldBankData } from "../Data/Map";


export interface WorldBankIndicatorRequest {
  indicator: string;
  date: string;
  format: string;
}
// New response type for Advanced Data API
// WorldBankAdvancedResponse.ts

export interface AdvancedWorldBankResponse {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  lastupdated: string;
  source: {
    id: string;
    name: string;
    data: Array<{
      variable: Array<{
        concept: string;
        id: string;
        value: string;
      }>;
      value: number | null;
    }>;
  };
}

export interface AdvancedDataEntry {
  variable: Array<{
    concept: string;
    id: string;
    value: string;
  }>;
  value: number | null;
}

  // Extend the existing ProcessedWorldBankData
  export interface AdvancedProcessedWorldBankData extends ProcessedWorldBankData {
    source: string;
    version?: string;
    // Add any other fields you might need
  }