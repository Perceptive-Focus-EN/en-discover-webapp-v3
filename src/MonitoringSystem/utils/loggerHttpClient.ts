// src/MonitoringSystem/utils/loggerHttpClient.ts
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface LoggerRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

const loggerHttpClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simplified request interceptor without auth
loggerHttpClient.interceptors.request.use(
  (config: LoggerRequestConfig) => {
    config.metadata = {
      startTime: Date.now(),
    };
    return config;
  },
  (error) => {
    console.error('Logger HTTP Client Request Error:', error);
    return Promise.reject(error);
  }
);

// Simplified response interceptor without monitoring
loggerHttpClient.interceptors.response.use(
  (response) => {
    const config = response.config as LoggerRequestConfig;
    const duration = Date.now() - (config.metadata?.startTime || Date.now());
    console.debug(`Logger request completed in ${duration}ms`);
    return response;
  },
  (error) => {
    console.error('Logger HTTP Client Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export { loggerHttpClient };