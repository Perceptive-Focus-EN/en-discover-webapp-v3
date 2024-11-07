// src/lib/api_s/stripe/customBillingLogic.ts
import axiosInstance from '../../axiosSetup';
import { BILLING_ENDPOINTS } from '../../../constants/billingConstants';
import { BillingAPIResponse, OptimizeStorageRequest } from '../../../types/Billing';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const billingApi = {
  async getCustomBillingData(tenantId: string): Promise<BillingAPIResponse> {
    const response = await axiosInstance.get<BillingAPIResponse>(
      BILLING_ENDPOINTS.GET_BILLING_DATA, 
      { params: { tenantId } }
    );
    return response.data;
  },

  async optimizeStorage(data: OptimizeStorageRequest): Promise<void> {
    messageHandler.info('Optimizing storage...');
    await axiosInstance.post(BILLING_ENDPOINTS.OPTIMIZE_STORAGE, data);
    messageHandler.success('Storage optimization completed');
  }

  // Add any other custom billing operations here, following the same pattern:
  // - GET operations: no messages
  // - POST/PUT/DELETE operations: success messages
  // - Let axiosInstance handle errors
};