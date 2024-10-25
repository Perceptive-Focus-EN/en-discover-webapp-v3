// src/lib/api_s/user.ts
import { api } from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { ExtendedUserInfo } from '@/types/User/interfaces';
import { AllRoles } from '../../constants/AccessKey/AccountRoles';
import { TenantUserSignupData } from '@/types/Signup/interfaces';
import { TenantInfo } from '@/types/Tenant/interfaces';

export const userApi = {
  getCurrentUser: async (): Promise<ExtendedUserInfo> => {
    return api.get<ExtendedUserInfo>(API_ENDPOINTS.GET_CURRENT_USER);
  },

  updateTitle: async (
    userId: string, 
    data: { role: AllRoles; accessLevel: string }
  ): Promise<ExtendedUserInfo> => {
    return api.put<ExtendedUserInfo>(
      `${API_ENDPOINTS.UPDATE_USER}/${userId}`, 
      data
    );
  },

  getUser: async (userId: string): Promise<ExtendedUserInfo> => {
    return api.get<ExtendedUserInfo>(`${API_ENDPOINTS.GET_USER}/${userId}`);
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.DELETE_USER}/${userId}`);
  },

  createTenantUser: async (data: TenantUserSignupData): Promise<ExtendedUserInfo> => {
    const response = await api.post<{ user: ExtendedUserInfo }>(
      API_ENDPOINTS.CREATE_TENANT_USER, 
      data
    );
    return response.user;
  },

  switchTenant: async (tenantId: string): Promise<ExtendedUserInfo> => {
    return api.post<ExtendedUserInfo>(
      API_ENDPOINTS.SWITCH_TENANT, 
      { tenantId }
    );
  },

  joinTenant: async (tenantId: string): Promise<ExtendedUserInfo> => {
    return api.post<ExtendedUserInfo>(
      API_ENDPOINTS.JOIN_TENANT, 
      { tenantId }
    );
  },

  getUserTenants: async (): Promise<TenantInfo[]> => {
    return api.get<TenantInfo[]>(API_ENDPOINTS.GET_USER_TENANTS);
  }
};