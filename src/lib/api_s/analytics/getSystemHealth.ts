import axiosInstance from '../../axiosSetup';

export const getSystemHealth = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/api/dashboard/system-health');
    return response.data;
  } catch (error) {
    console.error('Error fetching system health:', error);
    throw new Error('Failed to fetch system health data');
  }
};