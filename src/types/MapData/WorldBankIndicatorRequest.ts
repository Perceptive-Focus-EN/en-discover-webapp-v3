// WorldBankRequestTypes.ts
export type WorldBankQueryType = 'indicator' | 'country' | 'topic' | 'advanced';

export type WorldBankIndicatorRequest = {
  queryType: WorldBankQueryType;
  indicator?: string | string[];
  country?: string | 'all';
  countries?: string[];
  topicId?: number;
  dateRange: [string, string];
  format?: 'json' | 'xml';
  per_page?: number;
  page?: number;
  language?: string;
  source?: number;
  gapfill?: 'Y' | 'N';
  footnote?: 'Y' | 'N';
  mrnev?: number;
};

export type WorldBankConfig = {
  queryType: WorldBankQueryType;
  indicator?: string;
  country?: string | 'all';
  topicId?: number;
  countries?: string[];
  indicators?: string[];
  dateRange: [string, string];
  perPage: Pagination;
};

export type Pagination = {
  page?: number;
  perPage?: number;
  pageSize?: number;
  total?: number;
};