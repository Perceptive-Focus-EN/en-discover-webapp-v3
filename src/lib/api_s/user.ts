// src/lib/api_s/user.ts
import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { ExtendedUserInfo } from '@/types/User/interfaces';
import { AllRoles } from '../../constants/AccessKey/AccountRoles';
import { TenantUserSignupData } from '@/types/Signup/interfaces';
import { TenantInfo } from '@/types/Tenant/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const userApi = {
  getCurrentUser: async (): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_CURRENT_USER);
    return response.data;
  },

  updateTitle: async (userId: string, data: { role: AllRoles; accessLevel: string }): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.put(`${API_ENDPOINTS.UPDATE_USER}/${userId}`, data);
    messageHandler.success('Title updated successfully');
    return response.data;
  },

  getUser: async (userId: string): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.GET_USER}/${userId}`);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.DELETE_USER}/${userId}`);
    messageHandler.success('User deleted successfully');
  },

  createTenantUser: async (data: TenantUserSignupData): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_TENANT_USER, data);
    messageHandler.success('Tenant user created successfully');
    return response.data.user;
  },

  switchTenant: async (tenantId: string): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.post(API_ENDPOINTS.SWITCH_TENANT, { tenantId });
    messageHandler.success('Successfully switched tenant');
    return response.data;
  },

  joinTenant: async (tenantId: string): Promise<ExtendedUserInfo> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOIN_TENANT, { tenantId });
    messageHandler.success('Successfully joined tenant');
    return response.data;
  },

  getUserTenants: async (): Promise<TenantInfo[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_USER_TENANTS);
    return response.data;
  }
};