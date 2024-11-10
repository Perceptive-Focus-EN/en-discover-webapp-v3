// src/lib/api_s/authorization.ts
import { api } from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { LoginRequest, AuthResponse } from '@/types/Login/interfaces';
import { SignupResponse, SignupRequest } from '@/types/Signup/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const authorizationApi = {

  // Remove error handling from signup method
  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    try {
      const response = await api.post<SignupResponse>(
        API_ENDPOINTS.USER_SIGNUP, 
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          skipAuthRefresh: true  // Skip auth refresh for signup
        }
      );

      if (response.success) {
        // No need to check verification - account is ready to use
        messageHandler.success('Account created successfully. Please log in.');
        return response;
      }
      
      throw new Error('Signup failed');
    } catch (error) {
      messageHandler.error(
        error instanceof Error ? error.message : 'Failed to create account'
      );
      throw error;
    }
  },


  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      API_ENDPOINTS.USER_LOGIN, 
      data
    );
    messageHandler.success('Login successful');
    return response;
  },

  requestMagicLink: async (email: string): Promise<void> => {
    await api.post(
      API_ENDPOINTS.REQUEST_MAGIC_LINK, 
      { email }
    );
    messageHandler.success('Magic link sent to your email');
  },

  verifyMagicLink: async (token: string): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>(
      `${API_ENDPOINTS.VERIFY_MAGIC_LINK}/${token}`
    );
    messageHandler.success('Magic link verified successfully');
    return response;
  }
};
