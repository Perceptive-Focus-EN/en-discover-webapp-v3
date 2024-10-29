// src/lib/api_s/client/utils.ts

import { AxiosError } from 'axios';
import axiosInstance, { api } from '@/lib/axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

// Debug logs for setup verification
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('Axios instance configured:', !!axiosInstance);
console.log('API methods available:', Object.keys(api));

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
    status: number;
}

export const isApiError = (error: any): error is AxiosError<ApiErrorResponse> => {
    return error.isAxiosError && error.response?.data?.error !== undefined;
};

export const extractErrorMessage = (error: any): string => {
    console.log('extractErrorMessage called with error:', error);
    if (isApiError(error)) {
        console.log('API error detected:', error.response?.data.error);
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
    return error.message || 'An unexpected error occurred';
};

export const extractValidationErrors = (error: any): ValidationError[] => {
    console.log('extractValidationErrors called with error:', error);
    if (isApiError(error) && error.response?.data.error.errors) {
        console.log('Validation errors detected:', error.response.data.error.errors);
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
        console.log('GET request to:', url, 'with params:', params);
        try {
            const queryString = params ? buildQueryString(params) : '';
            const startTime = Date.now();

            const response = await api.get<ApiResponse<T>>(`${url}${queryString}`, config);

            console.log('GET response:', response);

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
            console.error('GET request error:', error);
            handleApiError(error, 'GET', url);
            throw error;
        }
    },

    async post<T>(url: string, data?: any, config = {}) {
        console.log('POST request to:', url, 'with data:', data);
        try {
            const startTime = Date.now();

            const response = await api.post<ApiResponse<T>>(url, data, config);

            console.log('POST response:', response);

            monitoringManager.metrics.recordMetric(
                MetricCategory.PERFORMANCE,
                'api_request',
                'duration',
                Date.now() - startTime,
                MetricType.HISTOGRAM,
                MetricUnit.MILLISECONDS,
                { method: 'POST', endpoint: url }
            );

            return response;
        } catch (error) {
            console.error('POST request error:', error);
            handleApiError(error, 'POST', url);
            throw error;
        }
    },

    async put<T>(url: string, data?: any, config = {}) {
        console.log('PUT request to:', url, 'with data:', data);
        try {
            const startTime = Date.now();

            const response = await api.put<ApiResponse<T>>(url, data, config);

            console.log('PUT response:', response);

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
            console.error('PUT request error:', error);
            handleApiError(error, 'PUT', url);
            throw error;
        }
    },

    async delete<T>(url: string, config = {}) {
        console.log('DELETE request to:', url);
        try {
            const startTime = Date.now();

            const response = await api.delete<ApiResponse<T>>(url, config);

            console.log('DELETE response:', response);

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
            console.error('DELETE request error:', error);
            handleApiError(error, 'DELETE', url);
            throw error;
        }
    },
};

// Error handling helper
const handleApiError = (error: any, method: string, url: string) => {
    console.error('API error in', method, 'request to', url, ':', error);
    if (isApiError(error)) {
        const errorDetails = error.response?.data.error;
        console.log('API error details:', errorDetails);
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
                errorType: error.name || 'unknown',
            }
        );

        messageHandler.error('An unexpected error occurred. Please try again.');
    }
};

export default apiRequest;