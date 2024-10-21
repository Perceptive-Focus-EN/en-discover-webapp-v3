// src/types/Dashboard/Data/Map/Census/interfaces.ts

export interface CensusConfig {
    endpoint: string;
    getParams: string[];
    forClause: string;
    year: string;
    stateIndex: number;
  }
  