// // src/lib/api_s/notifications/unread-notification.ts

// import axiosInstance from '../../axiosSetup';
// import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
// import { AxiosError } from 'axios';

// export const fetchUnreadNotificationCount = async (): Promise<number> => {
//   try {
//     const response = await axiosInstance.get<{ count: number }>(API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT);
//     return response.data.count;
//   } catch (error) {
//     if (error instanceof AxiosError) {
//       console.error('Error fetching unread notification count:', error.response?.data || error.message);
//     } else {
//       console.error('Unexpected error:', error);
//     }
//     throw error;
//   }
// };


// src/lib/api_s/notifications/unread-notification.ts

import { getMockUnreadCount } from '../../mockData/notifications';

export const fetchUnreadNotificationCount = async (): Promise<number> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return getMockUnreadCount();
};