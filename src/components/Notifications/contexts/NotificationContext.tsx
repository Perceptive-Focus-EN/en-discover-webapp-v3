import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api_s/notifications';
import { Notification } from '@/components/Notifications/types/notification';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  newNotifications: Notification[];
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  subscribe: (topic: string) => Promise<void>;
  unsubscribe: (topic: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    try {
      const fetchedNotifications = await notificationsApi.fetch();
      setNotifications(fetchedNotifications);
      setNewNotifications(fetchedNotifications.filter(n => !n.read));
    } catch (error) {
      console.error('Failed to load notifications:', error);
      messageHandler.error('Failed to load notifications');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setNewNotifications(newNotifications.filter(n => n.id !== notificationId));
      await loadUnreadCount(); // Refresh unread count
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      messageHandler.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setNewNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      messageHandler.error('Failed to mark all notifications as read');
    }
  };

  const subscribe = async (topic: string) => {
    try {
      await notificationsApi.subscribe(topic);
      await loadNotifications(); // Refresh notifications after subscribing
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      messageHandler.error('Failed to subscribe to notifications');
    }
  };

  const unsubscribe = async (topic: string) => {
    try {
      await notificationsApi.unsubscribe(topic);
      await loadNotifications(); // Refresh notifications after unsubscribing
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      messageHandler.error('Failed to unsubscribe from notifications');
    }
  };

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      newNotifications,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      subscribe,
      unsubscribe
    }}>
      {children}
    </NotificationContext.Provider>
  );
};