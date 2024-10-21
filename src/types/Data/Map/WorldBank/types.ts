// src/types/WorldBank/types.ts

export type WorldBankQueryType = 'indicator' | 'country' | 'topic' | 'advanced';

export type DateRange = [string, string];

export type GapFillOption = 'Y' | 'N';

export type FormatOption = 'json' | 'xml';

export type CountryOption = string | 'all';

export type IndicatorOption = string | string[];
