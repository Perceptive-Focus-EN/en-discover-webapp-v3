// src/lib/api_s/user.ts

import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { UpdateUserInfoRequest, User, ExtendedUserInfo } from '@/types/User/interfaces';
import { ROLES, AllRoles } from '../../constants/AccessKey/AccountRoles'
import { TenantUserSignupData } from '@/types/Signup/interfaces';
import { TenantInfo } from '@/types/Tenant/interfaces';

export const userApi = {
  getCurrentUser: (): Promise<ExtendedUserInfo> =>
    axiosInstance.get(API_ENDPOINTS.GET_CURRENT_USER),

  updateTitle: (userId: string, data: { role: AllRoles ; accessLevel: string }): Promise<ExtendedUserInfo> =>
    axiosInstance.put(`${API_ENDPOINTS.UPDATE_USER}/${userId}`, data),

  getUser: (userId: string): Promise<ExtendedUserInfo> =>
    axiosInstance.get(`${API_ENDPOINTS.GET_USER}/${userId}`),

  deleteUser: (userId: string): Promise<void> =>
    axiosInstance.delete(`${API_ENDPOINTS.DELETE_USER}/${userId}`),

  createTenantUser: async (data: TenantUserSignupData): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_TENANT_USER, data);
    return response.data.user;
  },

    // Renamed from switchAccount to switchTenant
  switchTenant: (tenantId: string): Promise<ExtendedUserInfo> =>
    axiosInstance.post(API_ENDPOINTS.SWITCH_TENANT, { tenantId }),

  // Renamed from addAccount to joinTenant
  joinTenant: (tenantId: string): Promise<ExtendedUserInfo> =>
    axiosInstance.post(API_ENDPOINTS.JOIN_TENANT, { tenantId }),

  // Renamed from getAccounts to getUserTenants
  getUserTenants: (): Promise<TenantInfo[]> =>
    axiosInstance.get(API_ENDPOINTS.GET_USER_TENANTS),
};

export default userApi;