// src/lib/axiosSetup.ts
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as authManager from '../utils/TokenManagement/authManager';
import simpleLogger from '../utils/ErrorHandling/simpleLogger';

interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
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

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = authManager.getAccessToken();
    if (token) {
      if (authManager.isTokenExpired(token)) {
        // Token is already expired, attempt to refresh immediately
        try {
          const newTokens = await authManager.refreshTokens();
          if (newTokens) {
            token = newTokens.accessToken;
            simpleLogger.info('Token refreshed successfully after expiration');
          } else {
            // If refresh failed, clear the token to trigger re-authentication
            authManager.clearTokens();
            token = null;
          }
        } catch (error) {
          simpleLogger.error('Error refreshing expired token:', error);
          authManager.clearTokens();
          token = null;
        }
      } else if (authManager.isTokenAboutToExpire(token)) {
        // Token is about to expire, attempt to refresh proactively
        try {
          const newTokens = await authManager.refreshTokens();
          if (newTokens) {
            token = newTokens.accessToken;
            simpleLogger.info('Token refreshed successfully proactively');
          }
        } catch (error) {
          simpleLogger.error('Error refreshing token proactively:', error);
          // Continue with the current token if proactive refresh fails
        }
      }
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    simpleLogger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newTokens = await authManager.refreshTokens();
        if (newTokens) {
          authManager.setTokens(newTokens.accessToken, newTokens.refreshToken, newTokens.sessionId);
          originalRequest.headers.set('Authorization', `Bearer ${newTokens.accessToken}`);
          simpleLogger.info('Token refreshed successfully after 401 response');
          return axiosInstance(originalRequest);
        } else {
          throw new Error('Failed to refresh tokens');
        }
      } catch (refreshError) {
        simpleLogger.error('Error refreshing token:', refreshError);
        await authManager.logout();
        // Redirect to login page or show auth error
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    simpleLogger.error('Response interceptor error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;