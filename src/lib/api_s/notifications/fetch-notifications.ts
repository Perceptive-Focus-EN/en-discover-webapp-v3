// import axiosInstance from '../../axiosSetup';
// import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
// import { AxiosError } from 'axios';
// import { Notification } from '../../../components/Notifications/types/notification';

// export const fetchNotifications = async (limit: number = 20, skip: number = 0): Promise<Notification[]> => {
//   try {
//     const response = await axiosInstance.get<{ notifications: Notification[] }>(
//       `${API_ENDPOINTS.NOTIFICATIONS_FETCH}?limit=${limit}&skip=${skip}`
//     );
//     return response.data.notifications;
//   } catch (error) {
//     if (error instanceof AxiosError) {
//       console.error('Error fetching notifications:', error.response?.data || error.message);
//     } else {
//       console.error('Unexpected error:', error);
//     }
//     throw error;
//   }
// };


// src/lib/api_s/notifications/fetch-notifications.ts

import { Notification } from '../../../components/Notifications/types/notification';
import { getMockNotifications } from '../../mockData/notifications';

export const fetchNotifications = async (): Promise<Notification[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return getMockNotifications();
};