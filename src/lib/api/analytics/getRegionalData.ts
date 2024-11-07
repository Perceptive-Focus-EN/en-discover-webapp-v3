import axiosInstance from '../../axiosSetup';

export const getRegionalData = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/api/dashboard/regional-data');
    return response.data;
  } catch (error) {
    console.error('Error fetching regional data:', error);
    throw new Error('Failed to fetch regional data');
  }
};