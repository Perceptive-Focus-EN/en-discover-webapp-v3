/**
 * Defines the types of notifications that can be sent.
 */
export type NotificationType = 'newFeature' | 'productUpdate' | 'newsletter' | 'blog' | 'survey' | 'marketing' | 'loginAlerts';

/**
 * Defines the channels through which notifications can be sent.
 */
export type NotificationChannel = 'email' | 'sms' | 'inApp';

/**
 * Represents user preferences for each notification type.
 */
export type UserNotifications = Record<NotificationType, boolean>;

/**
 * Represents user notification settings across all channels.
 */
export type UserNotificationSettings = {
  [K in NotificationChannel]: UserNotifications;
};

/**
 * Defines the actions that can be performed on the notification state.
 */
export type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserNotificationSettings> };