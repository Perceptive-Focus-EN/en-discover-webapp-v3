export type WorldBankApiResponse = [
  PaginationInfo,
  DataEntry[]
];

export type PaginationInfo = {
  page: number;
  pages: number;
  per_page: number;
  total: number;
};

export type DataEntry = {
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
};