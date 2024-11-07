// src/components/Resources/hooks/useResourceList.ts
import { useState, useCallback, useEffect } from 'react';
import { resourcesApi } from '../api/resourcesApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { 
  Resource,
  ResourceFilters,
  ResourceSortOptions,
  ResourceListState,
  ResourceListHookReturn
} from '../../../types/ArticleMedia';
import { PaginationMetadata } from '@/types/pagination';

const DEFAULT_SORT: ResourceSortOptions = {
  field: 'datePublished' as ResourceSortField,
  order: 'desc'
};

const DEFAULT_FILTERS: ResourceFilters = {
  category: [],
  searchTerm: '',
  status: 'published',
  visibility: 'public'
};

const DEFAULT_PAGINATION: PaginationMetadata = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10,
  hasNextPage: false,
  hasPreviousPage: false
};

export const useResourceList = (
  initialFilters: ResourceFilters = DEFAULT_FILTERS,
  initialSort: ResourceSortOptions = DEFAULT_SORT,
  initialItemsPerPage: number = 10
): ResourceListHookReturn => {
  const [state, setState] = useState<ResourceListState>({
    resources: [],
    loading: false,
    error: null,
    filters: initialFilters,
    sort: initialSort,
    pagination: {
      ...DEFAULT_PAGINATION,
      itemsPerPage: initialItemsPerPage
    }
  });

  const fetchResources = useCallback(async (page = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await resourcesApi.getResources(
        page,
        state.pagination.itemsPerPage,
        state.filters,
        state.sort
      );

      setState(prev => ({
        ...prev,
        resources: response.data,
        pagination: response.pagination,
        loading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resources';
      setState(prev => ({
        ...prev,
        error: new Error(errorMessage),
        loading: false
      }));
      messageHandler.error('Failed to fetch resources');
    }
  }, [state.filters, state.sort, state.pagination.itemsPerPage]);

  const handleSearch = useCallback((searchTerm: string) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        searchTerm
      },
      pagination: {
        ...prev.pagination,
        currentPage: 1
      }
    }));
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<ResourceFilters>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters
      },
      pagination: {
        ...prev.pagination,
        currentPage: 1
      }
    }));
  }, []);

  const handleSortChange = useCallback((sort: ResourceSortOptions) => {
    setState(prev => ({
      ...prev,
      sort,
      pagination: {
        ...prev.pagination,
        currentPage: 1
      }
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= state.pagination.totalPages) {
      setState(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          currentPage: page
        }
      }));
    }
  }, [state.pagination.totalPages]);

  const refreshResources = useCallback(async () => {
    await fetchResources(state.pagination.currentPage);
  }, [fetchResources, state.pagination.currentPage]);

  // Fetch resources when filters or sort changes
  useEffect(() => {
    fetchResources(1);
  }, [state.filters, state.sort]);

  return {
    state,
    handleSearch,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    refreshResources,
    isLoading: state.loading,
    hasError: !!state.error,
    errorMessage: state.error?.message
  };
};

export default useResourceList;