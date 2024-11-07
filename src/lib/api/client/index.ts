// src/lib/api_s/client/index.ts
import { api } from '@/lib/axiosSetup';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';

export class ApiClient {
    private recordMetric(operation: string, startTime: number, metadata: Record<string, any>) {
        monitoringManager.metrics.recordMetric(
            MetricCategory.PERFORMANCE,
            'api_request',
            'duration',
            Date.now() - startTime,
            MetricType.HISTOGRAM,
            MetricUnit.MILLISECONDS,
            {
                operation,
                ...metadata
            }
        );
    }

    async getPaginated<T>(
        url: string,
        params: PaginationParams = { page: 1, limit: 20 }
    ): Promise<PaginatedResponse<T>> {
        const startTime = Date.now();
        try {
            const queryParams = new URLSearchParams();
            
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.cursor) queryParams.append('cursor', params.cursor);
            if (params.sort) {
                queryParams.append('sortField', params.sort.field);
                queryParams.append('sortOrder', params.sort.order);
            }
            if (params.filter) {
                Object.entries(params.filter).forEach(([key, value]) => {
                    queryParams.append(`filter[${key}]`, String(value));
                });
            }

            const response = await api.get<PaginatedResponse<T>>(
                `${url}?${queryParams.toString()}`
            );

            this.recordMetric('GET_PAGINATED', startTime, {
                url,
                page: params.page,
                limit: params.limit,
                success: true
            });

            return response;
        } catch (error) {
            console.error('Error fetching paginated data:', error);
            console.error('Error details:', {
                url,
                params,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            });

            this.recordMetric('GET_PAGINATED', startTime, {
                url,
                error: true,
                errorType: error.name || 'unknown'
            });
            messageHandler.error('Failed to fetch paginated data');
            throw error;
        }
    }

    async getNextPage<T>(
        url: string,
        currentResponse: PaginatedResponse<T>,
        params: Omit<PaginationParams, 'page'> = {}
    ): Promise<PaginatedResponse<T>> {
        if (!currentResponse.pagination.hasNextPage) {
            return currentResponse;
        }

        return this.getPaginated<T>(url, {
            ...params,
            page: currentResponse.pagination.currentPage + 1,
            limit: currentResponse.pagination.itemsPerPage
        });
    }
}

export const clientApi = new ApiClient();