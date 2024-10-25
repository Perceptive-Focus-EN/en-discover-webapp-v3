// src/lib/axiosSetup.ts
import axios, { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse 
} from 'axios';
import authManager from '../utils/TokenManagement/authManager';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _startTime?: number;
}

interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
    reference?: string;
    statusCode: number;
  };
}

class AxiosManager {
  private static instance: AxiosInstance;
  private static isRefreshing = false;
  private static failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
  }> = [];

  private static processQueue(error: any = null): void {
    AxiosManager.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve();
      }
    });
    AxiosManager.failedQueue = [];
  }

  public static getInstance(): AxiosInstance {
    if (!AxiosManager.instance) {
      AxiosManager.instance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      AxiosManager.setupInterceptors();
    }
    return AxiosManager.instance;
  }

  private static setupInterceptors(): void {
    // Request Interceptor
    AxiosManager.instance.interceptors.request.use(
      async (config: CustomAxiosRequestConfig) => {
        config._startTime = Date.now();

        try {
          const token = await authManager.getValidToken();
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
          } else if (!config.url?.includes('/auth/')) {
            throw new Error('No valid token');
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
    AxiosManager.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as CustomAxiosRequestConfig;
        const duration = config._startTime ? Date.now() - config._startTime : 0;

        monitoringManager.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          'api',
          'request_duration',
          duration,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS,
          {
            endpoint: config.url,
            method: config.method,
            status: response.status
          }
        );

        if (response.data?.message) {
          messageHandler.success(response.data.message);
        }

        return response;
      },
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;
        const duration = originalRequest._startTime ? Date.now() - originalRequest._startTime : 0;

        monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'api',
          'request_error',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            endpoint: originalRequest.url,
            method: originalRequest.method,
            status: error.response?.status,
            duration
          }
        );

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (AxiosManager.isRefreshing) {
            return new Promise((resolve, reject) => {
              AxiosManager.failedQueue.push({ resolve, reject });
            })
              .then(() => AxiosManager.instance(originalRequest))
              .catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          AxiosManager.isRefreshing = true;

          try {
            await authManager.refreshAuth();
            const token = await authManager.getValidToken();
            
            if (token) {
              AxiosManager.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              AxiosManager.processQueue();
              return AxiosManager.instance(originalRequest);
            }
            
            AxiosManager.processQueue(new Error('Token refresh failed'));
            messageHandler.error('Session expired. Please log in again.');
            await authManager.logout();
            window.location.href = '/login';
            return Promise.reject(error);
          } catch (refreshError) {
            AxiosManager.processQueue(refreshError);
            messageHandler.error('Session expired. Please log in again.');
            await authManager.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            AxiosManager.isRefreshing = false;
          }
        }

        if (error.response?.status === 429) {
          messageHandler.error('Too many requests. Please try again later.');
          return Promise.reject(error);
        }

        if (!error.response) {
          messageHandler.error('Network error. Please check your connection.');
          return Promise.reject(error);
        }

        if (error.response?.data?.error) {
          messageHandler.handleApiError({
            message: error.response.data.error.message,
            type: error.response.data.error.type,
            reference: error.response.data.error.reference,
            statusCode: error.response.status
          });
        } else {
          messageHandler.error('An unexpected error occurred. Please try again.');
        }
        
        return Promise.reject(error);
      }
    );

    // Timeout handling
    AxiosManager.instance.interceptors.request.use((config) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        messageHandler.error('Request timed out. Please try again.');
      }, config.timeout || 30000);

      return {
        ...config,
        signal: controller.signal,
        beforeRedirect: () => clearTimeout(timeoutId)
      };
    });

    // Response validation
    AxiosManager.instance.interceptors.response.use((response) => {
      if (response.data && typeof response.data === 'object') {
        return response;
      }
      messageHandler.error('Invalid response format received.');
      return Promise.reject(new Error('Invalid response format'));
    });
  }
}

// Export configured instance
const axiosInstance = AxiosManager.getInstance();
export default axiosInstance;

// Export helper methods
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