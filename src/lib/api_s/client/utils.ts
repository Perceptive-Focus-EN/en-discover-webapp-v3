// src/lib/api_s/client/utils.ts

import { AxiosError } from 'axios';
import { api } from '@/lib/axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

// Utility function to build query string from parameters
const buildQueryString = (params: Record<string, any>): string => {
    const queryString = Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    return queryString ? `?${queryString}` : '';
};

export interface ApiErrorResponse {
    error: {
        message: string;
        type: string;
        reference?: string;
        code?: string;
        errors?: ValidationError[];
    };
    statusCode: number;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

export const isApiError = (error: any): error is AxiosError<ApiErrorResponse> => {
    return error?.isAxiosError && error?.response?.data?.error !== undefined;
};

export const extractErrorMessage = (error: any): string => {
    if (isApiError(error)) {
        monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'api_error',
            'handled',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                errorType: error.response?.data.error.type,
                errorCode: error.response?.status.toString(),
            }
        );
        return error.response?.data.error.message || 'An unexpected error occurred';
    }
    return error?.message || 'An unexpected error occurred';
};

export const extractValidationErrors = (error: any): ValidationError[] => {
    if (isApiError(error) && error.response?.data.error.errors) {
        monitoringManager.metrics.recordMetric(
            MetricCategory.BUSINESS,
            'validation',
            'error',
            error.response.data.error.errors.length,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                fields: error.response.data.error.errors.map((e) => e.field).join(','),
            }
        );
        return error.response.data.error.errors;
    }
    return [];
};

// Enhanced API request helpers
export const apiRequest = {
    async get<T>(url: string, params?: Record<string, any>, config = {}) {
        try {
            const queryString = params ? buildQueryString(params) : '';
            const startTime = Date.now();
            const response = await api.get<ApiResponse<T>>(`${url}${queryString}`, config);

            monitoringManager.metrics.recordMetric(
                MetricCategory.PERFORMANCE,
                'api_request',
                'duration',
                Date.now() - startTime,
                MetricType.HISTOGRAM,
                MetricUnit.MILLISECONDS,
                { method: 'GET', endpoint: url }
            );

            return response;
        } catch (error) {
            handleApiError(error, 'GET', url);
            throw error;
        }
    },

    async post<T>(url: string, data?: any, config = {}) {
        try {
            const startTime = Date.now();
            const response = await api.post<ApiResponse<T>>(url, data, config);

            // Log the response for debugging
            console.log('API Response:', response);

            monitoringManager.metrics.recordMetric(
                MetricCategory.PERFORMANCE,
                'api_request',
                'duration',
                Date.now() - startTime,
                MetricType.HISTOGRAM,
                MetricUnit.MILLISECONDS,
                { method: 'POST', endpoint: url }
            );

            // Return the response directly without additional transformation
            return response;
        } catch (error) {
            handleApiError(error, 'POST', url);
            throw error;
        }
    },

    async put<T>(url: string, data?: any, config = {}) {
        try {
            const startTime = Date.now();
            const response = await api.put<ApiResponse<T>>(url, data, config);

            monitoringManager.metrics.recordMetric(
                MetricCategory.PERFORMANCE,
                'api_request',
                'duration',
                Date.now() - startTime,
                MetricType.HISTOGRAM,
                MetricUnit.MILLISECONDS,
                { method: 'PUT', endpoint: url }
            );

            return response;
        } catch (error) {
            handleApiError(error, 'PUT', url);
            throw error;
        }
    },

    async delete<T>(url: string, config = {}) {
        try {
            const startTime = Date.now();
            const response = await api.delete<ApiResponse<T>>(url, config);

            monitoringManager.metrics.recordMetric(
                MetricCategory.PERFORMANCE,
                'api_request',
                'duration',
                Date.now() - startTime,
                MetricType.HISTOGRAM,
                MetricUnit.MILLISECONDS,
                { method: 'DELETE', endpoint: url }
            );

            return response;
        } catch (error) {
            handleApiError(error, 'DELETE', url);
            throw error;
        }
    },
};

const handleApiError = (error: any, method: string, url: string) => {
    if (isApiError(error)) {
        const errorDetails = error.response?.data.error;
        monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'api_error',
            'occurred',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                method,
                endpoint: url,
                errorType: errorDetails?.type,
                errorCode: error.response?.status.toString(),
                errorReference: errorDetails?.reference,
            }
        );

        messageHandler.handleApiError({
            message: errorDetails?.message || 'Unknown error occurred',
            type: errorDetails?.type || 'unknown',
            reference: errorDetails?.reference,
            statusCode: error.response?.status || 500,
        });
    } else {
        monitoringManager.metrics.recordMetric(
            MetricCategory.SYSTEM,
            'api_error',
            'unhandled',
            1,
            MetricType.COUNTER,
            MetricUnit.COUNT,
            {
                method,
                endpoint: url,
                errorType: error?.name || 'unknown',
            }
        );

        messageHandler.error('An unexpected error occurred. Please try again.');
    }
};

export default apiRequest;