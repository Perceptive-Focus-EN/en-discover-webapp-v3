// src/hooks/useResources.ts
import { useState } from 'react';
import { resourcesApi } from '@/components/Resources/api/resourcesApi';
import { Resource, ResourceFormData, ResourceVisibility, UploadStatus, ResourceStatus } from '@/types/ArticleMedia';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

const validateResource = (data: Resource) => {
    // Add your validation logic here
    return true;
};

export const useResources = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createResource = async (data: Omit<Resource, 'id' | 'rating' | 'votes' | 'status'>) => {
        setLoading(true);
        setError(null);
        try {
            // Validate resource data before creating
            const validData = {
                ...data,
                id: '', // or generate a unique id here
                rating: 0,
                votes: 0,
                status: 'draft' as ResourceStatus
            };

            if (!validateResource(validData)) {
                throw new Error('Invalid resource data');
            }

            const response = await resourcesApi.createResource(validData);
            messageHandler.success('Resource created successfully');
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create resource';
            setError(errorMessage);
            messageHandler.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getResources = async (page = 1, limit = 10, filters: { searchTerm?: string; category?: string[]; processingStatus?: UploadStatus[]; visibility?: ResourceVisibility; readingLevel?: "beginner" | "intermediate" | "advanced"; tags?: string[]; dateRange?: { start: Date; end: Date; }; }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await resourcesApi.getResources(page, limit, filters);
            return response.data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch resources';
            setError(errorMessage);
            messageHandler.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        createResource,
        getResources,
        loading,
        error
    };
};