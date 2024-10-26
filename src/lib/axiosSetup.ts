// src/lib/axiosSetup.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import authManager from '../utils/TokenManagement/authManager';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  circuitId?: string; // Add the circuitId property
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    try {
      const token = await authManager.getValidToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      messageHandler.error('Unable to process request. Please try again.');
      return Promise.reject(error);
    }
  },
  (error) => {
    messageHandler.error('Network connection issue. Please check your connection.');
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    const circuitId = (response.config as CustomAxiosRequestConfig).circuitId;
    if (circuitId) {
      // Record success instead of trying to reset
      monitoringManager.recordCircuitSuccess(circuitId);
    }

    if (response.data?.message) {
      messageHandler.success(response.data.message);
    }
    return response;
    },
  async (error: AxiosError<{ error?: { message: string; type: string; reference?: string } }>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    if (originalRequest.circuitId) {
      monitoringManager.error.createError(
        'system',
        'circuit_open',
        'Circuit breaker is open for the request',
        { circuitId: originalRequest.circuitId }
      );
    }
    
    // Handle 401 and token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await authManager.refreshAuth();
        const token = await authManager.getValidToken();
        
        if (token) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
        
        messageHandler.error('Session expired. Please log in again.');
        await authManager.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        messageHandler.error('Session expired. Please log in again.');
        await authManager.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle API error messages
    if (error.response?.data?.error) {
      messageHandler.handleApiError({
        message: error.response.data.error.message,
        type: error.response.data.error.type,
        reference: error.response.data.error.reference,
        statusCode: error.response.status
      });
    } else {
      // Fallback error message
      messageHandler.error('An unexpected error occurred. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

// Add the api helper methods while maintaining the original functionality
export const api = {
  get: <T>(url: string, config = {}) => 
    axiosInstance.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data = {}, config = {}) => 
    axiosInstance.post<T>(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data = {}, config = {}) => 
    axiosInstance.put<T>(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config = {}) => 
    axiosInstance.delete<T>(url, config).then(response => response.data)
};