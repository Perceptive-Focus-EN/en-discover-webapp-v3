// src/lib/api_s/user.ts
import api from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { ExtendedUserInfo } from '@/types/User/interfaces';
import { SignupRequest, SignupResponse, CreateTenantWithOwnerRequest, TenantInviteSignupRequest } from '@/types/Signup/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { AxiosError } from 'axios';
import { AllRoles } from '@/constants/AccessKey/AccountRoles';
import { TenantAssociation } from '@/types/User/interfaces';
import { Tenant } from '@/types/Tenant/interfaces';
import { AccessLevel } from '@/constants/AccessKey/access_levels';


interface ApiError {
  error: string;
  reference?: string;
  statusCode?: number;
}

interface EnhancedTenant extends Tenant {
  userRole: string | null;
  userAccessLevel: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
}
interface UpdateUserRoleResponse {
  success: boolean;
  message: string;
  association: TenantAssociation;
}

interface ApiError {
  error: string;
  reference?: string;
  statusCode?: number;
}

export const userApi = {
  getCurrentUser: async (): Promise<ExtendedUserInfo> => {
    try {
      const response = await api.get<ExtendedUserInfo>(API_ENDPOINTS.GET_CURRENT_USER);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      messageHandler.error(axiosError.response?.data?.error || 'Failed to fetch user data');
      throw error;
    }
  },

    updateUserRole: async (
    userId: string, 
    tenantId: string,
    role: AllRoles,
    accessLevel: AccessLevel
  ): Promise<TenantAssociation> => {
    try {
      const response = await api.put<UpdateUserRoleResponse>(
        `${API_ENDPOINTS.UPDATE_USER_ROLE}/${userId}/role`, // Updated to match server endpoint
        { tenantId, role, accessLevel }
      );

      if (response.data.success) {
        messageHandler.success(response.data.message);
        return response.data.association;
      }

      throw new Error('Role update response indicated failure');
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      messageHandler.error(
        axiosError.response?.data?.error || 
        'Failed to update user role'
      );
      throw error;
    }
  },

  createTenant: async (data: CreateTenantWithOwnerRequest): Promise<Tenant> => {
    try {
      const response = await api.post<{ tenant: Tenant }>(
        API_ENDPOINTS.CREATE_TENANT,
        data
      );
      messageHandler.success('Tenant created successfully');
      return response.data.tenant;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      messageHandler.error(axiosError.response?.data?.error || 'Failed to create tenant');
      throw error;
    }
  },

  joinTenantWithInvite: async (data: TenantInviteSignupRequest): Promise<SignupResponse> => {
    try {
      const response = await api.post<SignupResponse>(
        API_ENDPOINTS.JOIN_TENANT_INVITE,
        data
      );
      messageHandler.success('Successfully joined tenant');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      messageHandler.error(axiosError.response?.data?.error || 'Failed to join tenant');
      throw error;
    }
  },

  createTenantInvite: async (data: {
      email: string;
      role: AllRoles;
      accessLevel: AccessLevel;
      tenantId: string;
      expiresIn?: number;
    }): Promise<void> => {
  try {
    await api.post(API_ENDPOINTS.CREATE_TENANT_WIDGET, data);
    messageHandler.success('Invitation sent successfully');
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    messageHandler.error(axiosError.response?.data?.error || 'Failed to send invitation');
    throw error;
  }
  },

  switchTenant: async (tenantId: string): Promise<void> => {
  try {
    const response = await api.post(API_ENDPOINTS.SWITCH_TENANT, { tenantId });

    // Check if the switch was successful
    if (response.data.success) {
      const { session, context, user } = response.data;

      // Update tokens and session info in local storage or state
      localStorage.setItem('accessToken', session.accessToken);
      localStorage.setItem('refreshToken', session.refreshToken);
      localStorage.setItem('sessionId', session.sessionId);

      // Update user info and context, if necessary, for the new tenant
      localStorage.setItem('user', JSON.stringify({
        ...user,
        currentTenantId: tenantId,
        tenant: context.currentTenant,
      }));

      messageHandler.success('Successfully switched tenant context');
    } else {
      throw new Error('Failed to switch tenant context');
    }
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    messageHandler.error(axiosError.response?.data?.error || 'Failed to switch tenant');
    throw error;
  }
},

    getUserTenants: async (): Promise<EnhancedTenant[]> => {
    try {
      console.log('Fetching user tenants...');
      const response = await api.get<EnhancedTenant[]>(API_ENDPOINTS.GET_USER_TENANTS);

      if (!response.data) {
        throw new Error('No data received from tenant fetch');
      }

      console.log(`Successfully fetched ${response.data.length} tenants`);
      messageHandler.success('Successfully fetched tenants');
      return response.data;
      
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorMessage = axiosError.response?.data?.error || 'Failed to fetch user tenants';
      const errorReference = axiosError.response?.data?.reference;
      
      console.error('Tenant fetch error:', {
        message: errorMessage,
        reference: errorReference,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });

      messageHandler.error(errorMessage);
      
      // Re-throw with additional context
      throw {
        message: errorMessage,
        reference: errorReference,
        status: axiosError.response?.status,
        originalError: error
      };
    }
  }
};
