import axiosInstance from '../../axiosSetup';
import { BILLING_ENDPOINTS } from '../../../constants/billingConstants';
import { BillingAPIResponse, OptimizeStorageRequest } from '../../../types/Billing';

export const billingApi = {
  async getCustomBillingData(tenantId: string): Promise<BillingAPIResponse> {
    try {
      const response = await axiosInstance.get<BillingAPIResponse>(BILLING_ENDPOINTS.GET_BILLING_DATA, { params: { tenantId } });
      return response.data;
    } catch (error) {
      console.error('Error fetching custom billing data:', error);
      throw new Error('Failed to fetch custom billing data');
    }
  },

  async optimizeStorage(data: OptimizeStorageRequest): Promise<void> {
    try {
      await axiosInstance.post(BILLING_ENDPOINTS.OPTIMIZE_STORAGE, data);
    } catch (error) {
      console.error('Error optimizing storage:', error);
      throw new Error('Failed to optimize storage');
    }
  },

  // Add any other custom billing operations here
};