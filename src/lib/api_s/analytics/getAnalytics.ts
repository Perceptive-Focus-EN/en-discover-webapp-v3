import axiosInstance from '../../axiosSetup';

export const getAnalytics = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/api/dashboard/analytics');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new Error('Failed to fetch analytics data');
  }
};