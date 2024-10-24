// src/lib/api_s/stripe/customerPortal.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const customerPortalApi = {
  async createSession(): Promise<{ url: string }> {
    const response = await axiosInstance.post('/api/customer-portal');
    messageHandler.success('Customer portal session created');
    return response.data;
  }
};