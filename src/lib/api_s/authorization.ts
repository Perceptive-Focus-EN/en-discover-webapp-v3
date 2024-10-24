// src/lib/api_s/authorization.ts
import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { LoginRequest, AuthResponse } from '@/types/Login/interfaces';
import { SignupResponse, SignupRequest } from '@/types/Signup/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const authorizationApi = {
  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.USER_SIGNUP, data);
    messageHandler.success('Account created successfully');
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.USER_LOGIN, data);
    messageHandler.success('Login successful');
    return response.data;
  },

  requestMagicLink: async (email: string): Promise<void> => {
    await axiosInstance.post('/api/v1/app/auth/request-magic-link', { email });
    messageHandler.success('Magic link sent to your email');
  },

  verifyMagicLink: async (token: string): Promise<AuthResponse> => {
    const response = await axiosInstance.get(`/api/v1/app/auth/verify-magic-link/${token}`);
    messageHandler.success('Magic link verified successfully');
    return response.data;
  },

  logout: async (accessToken: string, refreshToken: string, sessionId: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT_USER, {
      accessToken,
      refreshToken,
      sessionId
    });
    messageHandler.success('Logged out successfully');
  },
};