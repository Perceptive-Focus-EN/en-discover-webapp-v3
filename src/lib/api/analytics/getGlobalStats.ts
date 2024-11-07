import axiosInstance from '../../axiosSetup';

export const getGlobalStats = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/api/dashboard/global-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching global stats:', error);
    throw new Error('Failed to fetch global stats');
  }
};