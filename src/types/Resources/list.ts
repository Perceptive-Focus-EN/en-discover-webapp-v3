// src/features/resources/types/list.ts
import { Resource } from './resources';
import { ResourceFilters, ResourceSortOptions } from './filters';

export interface ResourceListState {
  resources: Resource[];
  loading: boolean;
  error: Error | null;
  filters: ResourceFilters;
  sort: ResourceSortOptions;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ResourceListHookReturn {
  state: ResourceListState;
  handleSearch: (searchTerm: string) => void;
  handleFilterChange: (filters: ResourceFilters) => void;
  handleSortChange: (sort: ResourceSortOptions) => void;
  handlePageChange: (page: number) => void;
  refreshResources: () => Promise<void>;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}