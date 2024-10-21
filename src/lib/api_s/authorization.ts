import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { LoginRequest, AuthResponse } from '@/types/Login/interfaces';
import { SignupResponse, SignupRequest } from '@/types/Signup/interfaces';

export const authorizationApi = {
  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.USER_SIGNUP, data);
    return response.data as SignupResponse;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.USER_LOGIN, data);
    return response.data;
  },

  requestMagicLink: async (email: string): Promise<void> => {
    await axiosInstance.post('/api/v1/app/auth/request-magic-link', { email });
  },

  verifyMagicLink: async (token: string): Promise<AuthResponse> => {
    const response = await axiosInstance.get(`/api/v1/app/auth/verify-magic-link/${token}`);
    return response.data;
  },

  logout: async (accessToken: string, refreshToken: string, sessionId: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.LOGOUT_USER, {
      accessToken,
      refreshToken,
      sessionId
    });
  },
};