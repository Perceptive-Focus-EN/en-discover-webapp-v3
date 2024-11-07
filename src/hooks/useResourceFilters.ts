// src/hooks/useResourceFilters.ts
import { useState, useCallback } from 'react';
import { ResourceFilters } from '@/types/ArticleMedia/filters';
import { useResources } from './useResources';

export const useResourceFilters = () => {
    const [filters, setFilters] = useState<ResourceFilters>({});
    const { getResources } = useResources();

    const updateFilters = useCallback(async (newFilters: ResourceFilters) => {
        setFilters(newFilters);
        try {
            return await getResources(1, 10, {
                searchTerm: undefined,
                category: [],
                processingStatus: [],
                visibility: undefined,
                readingLevel: undefined,
                tags: [],
                dateRange: undefined,
                ...newFilters
            });
        } catch (error) {
            console.error('Error applying filters:', error);
            throw error;
        }
    }, [getResources]);

    const resetFilters = useCallback(async () => {
        setFilters({});
        try {
            return await getResources(1, 10, {
                searchTerm: undefined,
                category: [],
                processingStatus: [],
                visibility: undefined,
                readingLevel: undefined,
                tags: [],
                dateRange: undefined
            });
        } catch (error) {
            console.error('Error resetting filters:', error);
            throw error;
        }
    }, [getResources]);

    return {
        filters,
        updateFilters,
        resetFilters
    };
};