// src/types/WorldBank/request.ts

import { WorldBankQueryType, DateRange, GapFillOption, FormatOption, CountryOption, IndicatorOption } from './types';

export interface WorldBankIndicatorRequest {
  queryType: WorldBankQueryType;
  indicator?: IndicatorOption;
  country?: CountryOption;
  countries?: string[];
  topicId?: number;
  dateRange: DateRange;
  format?: FormatOption;
  per_page?: number;
  page?: number;
  language?: string;
  source?: number;
  gapfill?: GapFillOption;
  footnote?: GapFillOption;
  mrnev?: number;
}