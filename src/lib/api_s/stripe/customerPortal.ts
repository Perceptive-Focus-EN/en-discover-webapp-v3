import axiosInstance from '../../axiosSetup';

export const customerPortalApi = {
  async createSession(): Promise<{ url: string }> {
    try {
      const response = await axiosInstance.post('/api/customer-portal');
      return response.data;
    } catch (error) {
      console.error('Error fetching customer portal session:', error);
      throw new Error('Failed to fetch customer portal session');
    }
  }
};