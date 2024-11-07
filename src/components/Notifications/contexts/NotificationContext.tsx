import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api/notifications';
import { Notification } from '@/components/Notifications/types/notification';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  newNotifications: Notification[];
  isPolling: boolean;
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isPolling, setIsPolling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);

  // Public routes that don't need notifications
  const publicRoutes = ['/login', '/register', '/forgot-password'];
  const isPublicRoute = publicRoutes.includes(router.pathname);

  const loadUnreadCount = async () => {
    // Don't fetch if not authenticated or on public route
    if (!user || isPublicRoute || loading) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      if (user && !isPublicRoute && !loading) {
        setIsPolling(true);
        loadUnreadCount();
        pollInterval = setInterval(loadUnreadCount, 30000); // Poll every 30 seconds
      } else {
        setIsPolling(false);
        setUnreadCount(0);
        setNotifications([]);
        setNewNotifications([]);
      }
    };

    startPolling();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsPolling(false);
    };
  }, [user, isPublicRoute, loading, router.pathname]);

  const loadNotifications = async () => {
    if (!user || isPublicRoute || loading) {
      setNotifications([]);
      setNewNotifications([]);
      return;
    }

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
    if (!user) return;

    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setNewNotifications(newNotifications.filter(n => n.id !== notificationId));
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      messageHandler.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

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
    if (!user) return;

    try {
      await notificationsApi.subscribe(topic);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      messageHandler.error('Failed to subscribe to notifications');
    }
  };

  const unsubscribe = async (topic: string) => {
    if (!user) return;

    try {
      await notificationsApi.unsubscribe(topic);
      await loadNotifications();
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
      isPolling,
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