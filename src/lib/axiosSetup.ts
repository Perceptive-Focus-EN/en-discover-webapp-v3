// src/lib/axiosSetup.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as authManager from '../utils/TokenManagement/authManager';
import { messageHandler } from '../MonitoringSystem/managers/FrontendMessageHandler';

interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

interface ApiErrorResponse {
  error?: {
    message: string;
    type: string;
    reference?: string;
    statusCode?: number;
  };
  message?: string;
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const MAX_RETRY_ATTEMPTS = 3;

const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = authManager.getAccessToken();
    
    if (token) {
      if (authManager.isTokenExpired(token)) {
        try {
          const newTokens = await authManager.refreshTokens();
          if (newTokens) {
            token = newTokens.accessToken;
            messageHandler.info('Session refreshed');
          } else {
            authManager.clearTokens();
            token = null;
          }
        } catch (error) {
          messageHandler.error('Session expired. Please login again.');
          authManager.clearTokens();
          token = null;
        }
      } else if (authManager.isTokenAboutToExpire(token)) {
        try {
          const newTokens = await authManager.refreshTokens();
          if (newTokens) {
            token = newTokens.accessToken;
            messageHandler.info('Session extended');
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Proactive token refresh failed:', error);
          }
        }
      }

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return config;
  },
  (error: AxiosError) => {
    messageHandler.error('Request failed to send. Please check your connection.');
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig;
    
    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newTokens = await authManager.refreshTokens();
        if (newTokens) {
          authManager.setTokens(
            newTokens.accessToken, 
            newTokens.refreshToken, 
            newTokens.sessionId
          );
          originalRequest.headers.set('Authorization', `Bearer ${newTokens.accessToken}`);
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        messageHandler.error('Your session has expired. Please login again.');
        await authManager.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle retry logic
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Using nullish coalescing
      if (originalRequest._retryCount < MAX_RETRY_ATTEMPTS && 
          (error.response?.status ?? 0) >= 500) {  // Defaults to 0 if undefined
        originalRequest._retryCount++;
        return axiosInstance(originalRequest);
      }

    // Handle API error responses with type safety
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (errorData.error && typeof errorData.error === 'object') {
        messageHandler.handleApiError({
          message: errorData.error.message || 'An error occurred',
          type: errorData.error.type || 'API_ERROR',
          reference: errorData.error.reference,
          statusCode: error.response.status
        });
      } else if (errorData.message) {
        messageHandler.error(errorData.message);
      } else {
        messageHandler.error('An error occurred while processing your request');
      }
    } else if (error.request) {
      messageHandler.error('Unable to reach the server. Please check your connection.');
    } else {
      messageHandler.error('An unexpected error occurred');
    }

    // Development logging with type safety
    if (process.env.NODE_ENV === 'development') {
      console.error('Axios Error:', {
        config: error.config,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;