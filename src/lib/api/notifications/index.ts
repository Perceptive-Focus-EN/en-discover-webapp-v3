import { api } from '../../axiosSetup';
import { API_ENDPOINTS } from '../../../constants/endpointsConstants';
import { Notification } from '../../../components/Notifications/types/notification';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import authManager from '@/utils/TokenManagement/authManager';

interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

interface NotificationUpdateResponse {
  success: boolean;
  message: string;
}

export const notificationsApi = {
  fetch: async (limit: number = 20, skip: number = 0): Promise<Notification[]> => {
    if (!authManager.isAuthenticated()) {
      return [];
    }

    const startTime = Date.now();
    try {
      const response = await api.get<NotificationsResponse>(
        API_ENDPOINTS.NOTIFICATIONS_FETCH,
        {
          params: { limit, skip },
          skipAuthRefresh: true
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'notifications',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { count: response.notifications.length, limit, skip }
      );

      return response.notifications;
    } catch (error) {
      if (error.response?.status === 401) {
        return [];
      }
      messageHandler.error('Failed to fetch notifications');
      throw error;
    }
  },

  getUnreadCount: async (): Promise<number> => {
    if (!authManager.isAuthenticated()) {
      return 0;
    }

    try {
      const response = await api.get<{count: number}>(
        API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT,
        { skipAuthRefresh: true }
      );

      return response.count;
    } catch (error) {
      if (error.response?.status === 401) {
        return 0;
      }
      messageHandler.error('Failed to fetch unread count');
      return 0;
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    if (!authManager.isAuthenticated()) {
      return;
    }

    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_MARK_AS_READ,
        { notificationId },
        { skipAuthRefresh: true }
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
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      messageHandler.error('Failed to mark notification as read');
      throw error;
    }
  },

  markAllAsRead: async (): Promise<void> => {
    if (!authManager.isAuthenticated()) {
      return;
    }

    const startTime = Date.now();
    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_AS_READ,
        {},
        { skipAuthRefresh: true }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'notifications',
        'marked_all_read',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { duration: Date.now() - startTime }
      );
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      messageHandler.error('Failed to mark all notifications as read');
      throw error;
    }
  },

  subscribe: async (topic: string): Promise<void> => {
    if (!authManager.isAuthenticated()) {
      return;
    }

    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_SUBSCRIBE,
        { topic },
        { skipAuthRefresh: true }
      );
      messageHandler.success(`Subscribed to ${topic} notifications`);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      messageHandler.error('Failed to subscribe to notifications');
      throw error;
    }
  },

  unsubscribe: async (topic: string): Promise<void> => {
    if (!authManager.isAuthenticated()) {
      return;
    }

    try {
      await api.post<NotificationUpdateResponse>(
        API_ENDPOINTS.NOTIFICATIONS_UNSUBSCRIBE,
        { topic },
        { skipAuthRefresh: true }
      );
      messageHandler.success(`Unsubscribed from ${topic} notifications`);
    } catch (error) {
      if (error.response?.status === 401) {
        return;
      }
      messageHandler.error('Failed to unsubscribe from notifications');
      throw error;
    }
  }
};