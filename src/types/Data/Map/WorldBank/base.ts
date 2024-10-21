// src/types/WorldBank/base.ts

import { WorldBankQueryType, DateRange, CountryOption } from './types';

export interface Pagination {
  page?: number;
  perPage?: number;
  pageSize?: number;
  total?: number;
}

export interface WorldBankConfig {
  queryType: WorldBankQueryType;
  indicator?: string;
  country?: CountryOption;
  topicId?: number;
  countries?: string[];
  indicators?: string[];
  dateRange: DateRange;
  perPage: Pagination;
}

export interface WorldBankTopic {
  id: string;
  value: string;
}

export interface WorldBankPaginationInfo {
  page: number;
  pages: number;
  per_page: string;
  total: number;
}