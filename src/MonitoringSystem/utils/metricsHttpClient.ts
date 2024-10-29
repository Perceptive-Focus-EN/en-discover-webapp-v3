// src/MonitoringSystem/utils/metricsHttpClient.ts
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

interface MetricsRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

const metricsHttpClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simplified request interceptor without auth
metricsHttpClient.interceptors.request.use(
  (config: MetricsRequestConfig) => {
    config.metadata = {
      startTime: Date.now(),
    };
    return config;
  },
  (error) => {
    console.error('Metrics HTTP Client Request Error:', error);
    return Promise.reject(error);
  }
);

// Simplified response interceptor without monitoring
metricsHttpClient.interceptors.response.use(
  (response) => {
    const config = response.config as MetricsRequestConfig;
    const duration = Date.now() - (config.metadata?.startTime || Date.now());
    console.debug(`Metrics request completed in ${duration}ms`);
    return response;
  },
  (error) => {
    console.error('Metrics HTTP Client Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export { metricsHttpClient };