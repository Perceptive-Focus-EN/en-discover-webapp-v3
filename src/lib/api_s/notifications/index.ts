// src/lib/api_s/notifications/index.ts
import axiosInstance from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
import { Notification } from '../../../components/Notifications/types/notification';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const notificationsApi = {
  // Fetch notifications with pagination
  fetch: async (limit: number = 20, skip: number = 0): Promise<Notification[]> => {
    const response = await axiosInstance.get<{ notifications: Notification[] }>(
      `${API_ENDPOINTS.NOTIFICATIONS_FETCH}?limit=${limit}&skip=${skip}`
    );
    return response.data.notifications;
  },

  // Mark single notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.NOTIFICATIONS_MARK_AS_READ, { notificationId });
    messageHandler.success('Notification marked as read');
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_AS_READ);
    messageHandler.success('All notifications marked as read');
  },

  // Get unread notification count
  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get<{ count: number }>(
      API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT
    );
    return response.data.count;
  }
};

// src/lib/api_s/notifications/fetch-notifications.ts

// import { Notification } from '../../../components/Notifications/types/notification';
// import { getMockNotifications } from '../../mockData/notifications';
// 
// export const fetchNotifications = async (): Promise<Notification[]> => {
  // Simulate API call delay
  // await new Promise(resolve => setTimeout(resolve, 500));
  // return getMockNotifications();
// };
// 
// 