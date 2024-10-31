import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import authManager from '../utils/TokenManagement/authManager';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  circuitId?: string;
  metadata?: {
    startTime: number;
    [key: string]: any;
  };
  skipAuthRefresh?: boolean;
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
    // Don't make requests if we're not authenticated (unless it's a public route)
    const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];
    if (!publicRoutes.includes(config.url || '') && !authManager.isAuthenticated()) {
      return Promise.reject(new Error('Not authenticated'));
    }

    try {
      const token = await authManager.getValidToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      config.circuitId = `circuit_${Date.now()}`;
      config.metadata = {
        startTime: Date.now(),
      };
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
    const config = response.config as CustomAxiosRequestConfig;
    const startTime = config.metadata?.startTime || Date.now();
    const duration = Date.now() - startTime;

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'api_request',
      'duration',
      duration,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        endpoint: config.url,
        method: config.method,
        circuitId: config.circuitId,
        status: response.status
      }
    );

    if (config.circuitId) {
      monitoringManager.recordCircuitSuccess(config.circuitId);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    // Don't retry if explicitly disabled or already retried
    if (originalRequest.skipAuthRefresh || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 only for non-auth endpoints
    if (error.response?.status === 401 && !originalRequest.url?.includes('/api/auth/')) {
      try {
        originalRequest._retry = true;
        // Clear existing auth state
        await authManager.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
      const apiError = error.response.data.error as { message: string; type: string; reference: string };
      messageHandler.handleApiError({
        message: apiError.message,
        type: apiError.type,
        reference: apiError.reference,
        statusCode: error.response.status
      });
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const api = {
  get: <T>(url: string, config = {}) => 
    axiosInstance.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data = {}, config = {}) => 
    axiosInstance.post<T>(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data = {}, config = {}) => 
    axiosInstance.put<T>(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config = {}) => 
    axiosInstance.delete<T>(url, config).then(response => response.data),
    
  patch: <T>(url: string, data = {}, config = {}) => 
    axiosInstance.patch<T>(url, data, config).then(response => response.data)
};