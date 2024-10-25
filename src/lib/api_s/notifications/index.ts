// src/lib/api_s/notifications/index.ts
import { api } from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
import { Notification } from '../../../components/Notifications/types/notification';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

interface UnreadCountResponse {
  count: number;
}

interface NotificationUpdateResponse {
  success: boolean;
  message: string;
}

export const notificationsApi = {
  fetch: async (limit: number = 20, skip: number = 0): Promise<Notification[]> => {
    const startTime = Date.now();
    
    try {
      const response = await api.get<NotificationsResponse>(
        API_ENDPOINTS.NOTIFICATIONS_FETCH,
        {
          params: {
            limit,
            skip
          }
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'notifications',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          count: response.notifications.length,
          limit,
          skip
        }
      );

      return response.notifications;
    } catch (error) {
      messageHandler.error('Failed to fetch notifications');
      throw error;
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_MARK_AS_READ,
        { notificationId }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'notifications',
        'marked_read',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { notificationId }
      );

      messageHandler.success('Notification marked as read');
    } catch (error) {
      messageHandler.error('Failed to mark notification as read');
      throw error;
    }
  },

  markAllAsRead: async (): Promise<void> => {
    const startTime = Date.now();
    
    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_AS_READ
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'notifications',
        'marked_all_read',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          duration: Date.now() - startTime
        }
      );

      messageHandler.success('All notifications marked as read');
    } catch (error) {
      messageHandler.error('Failed to mark all notifications as read');
      throw error;
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<UnreadCountResponse>(
        API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'notifications',
        'unread_count',
        response.count,
        MetricType.GAUGE,
        MetricUnit.COUNT
      );

      return response.count;
    } catch (error) {
      messageHandler.error('Failed to fetch unread count');
      throw error;
    }
  },

  // Additional utility methods
  subscribe: async (topic: string): Promise<void> => {
    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_SUBSCRIBE,
        { topic }
      );
      messageHandler.success(`Subscribed to ${topic} notifications`);
    } catch (error) {
      messageHandler.error('Failed to subscribe to notifications');
      throw error;
    }
  },

  unsubscribe: async (topic: string): Promise<void> => {
    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_UNSUBSCRIBE,
        { topic }
      );
      messageHandler.success(`Unsubscribed from ${topic} notifications`);
    } catch (error) {
      messageHandler.error('Failed to unsubscribe from notifications');
      throw error;
    }
  }
};

// Mock data fetcher (if needed for development)
// export const getMockNotifications = async (): Promise<Notification[]> => {
  // await new Promise(resolve => setTimeout(resolve, 500));
  // return [
    // {
      // id: '1',
      // type: 'info',
      // message: 'Mock notification 1',
      // read: false,
      // createdAt: new Date().toISOString()
    // },
    // ... more mock notifications
  // ];
// };