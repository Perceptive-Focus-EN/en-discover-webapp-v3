// src/lib/api_s/authorization.ts
import { api } from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { LoginRequest, AuthResponse } from '@/types/Login/interfaces';
import { SignupResponse, SignupRequest } from '@/types/Signup/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const authorizationApi = {

  // Remove error handling from signup meth
  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response = await api.post<SignupResponse>(
      API_ENDPOINTS.USER_SIGNUP, 
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.success) {
      // Store auth tokens and session info
      if (response.session) {
        localStorage.setItem('accessToken', response.session.accessToken);
        localStorage.setItem('refreshToken', response.session.refreshToken);
        localStorage.setItem('sessionId', response.session.sessionId);
      }

      // Store initial user context with tenant relationships
      if (response.user && response.context) {
        localStorage.setItem('user', JSON.stringify({
          ...response.user,
          currentTenantId: response.user.tenants.context.currentTenantId,
          personalTenantId: response.user.tenants.context.personalTenantId,
          tenantAssociations: response.user.tenants.associations
        }));
      }

      messageHandler.success(
        response.message || 
        'Account created successfully. Please check your email for verification.'
      );

      return response;
    }

    throw new Error('Signup response indicated failure');
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
