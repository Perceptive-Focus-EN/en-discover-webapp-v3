// import axiosInstance from '../../axiosSetup';
// import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
// import { AxiosError } from 'axios';

// export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
//   try {
//     await axiosInstance.post(API_ENDPOINTS.NOTIFICATIONS_MARK_AS_READ, { notificationId });
//   } catch (error) {
//     if (error instanceof AxiosError) {
//       console.error('Error marking notification as read:', error.response?.data || error.message);
//     } else {
//       console.error('Unexpected error:', error);
//     }
//     throw error;
//   }
// };

// export const markAllNotificationsAsRead = async (): Promise<void> => {
//   try {
//     await axiosInstance.post(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_AS_READ);
//   } catch (error) {
//     if (error instanceof AxiosError) {
//       console.error('Error marking all notifications as read:', error.response?.data || error.message);
//     } else {
//       console.error('Unexpected error:', error);
//     }
//     throw error;
//   }
// };


// src/lib/api_s/notifications/mark-as-read.ts

import { getMockNotifications } from '../../mockData/notifications';

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const notifications = getMockNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const notifications = getMockNotifications();
  notifications.forEach(n => n.read = true);
};