// src/contexts/NotificationContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchUnreadNotificationCount } from '../../../lib/api_s/notifications/unread-notification';
import { fetchNotifications } from '../../../lib/api_s/notifications';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../../lib/api_s/notifications/mark-as-read';
import { Notification } from '../../../components/Notifications/types/notification';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  newNotifications: Notification[];
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
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


    // Make sure loadUnreadCount sets the count to 0 if there's an error:
  const loadUnreadCount = async () => {
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
      setUnreadCount(0);
    }
  };

  const loadNotifications = async () => {
    try {
      const fetchedNotifications = await fetchNotifications();
      setNotifications(fetchedNotifications);
      setNewNotifications(fetchedNotifications.filter(n => !n.read));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setNewNotifications(newNotifications.filter(n => n.id !== notificationId));
      await loadUnreadCount(); // Refresh unread count
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setNewNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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
    }}>
      {children}
    </NotificationContext.Provider>
  );
};