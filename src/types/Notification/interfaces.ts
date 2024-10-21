import { NotificationAction, NotificationType, UserNotifications } from './types';
import { NotificationChannel } from './types';
import { FrequencyType } from '../Shared/types';

/**
 * Represents user notification settings for each channel.
 * Maps each notification channel to its corresponding notification preferences.
 */
export type UserNotificationSettings = {
  [key in NotificationChannel]: UserNotifications;
};

/**
 * Defines user preferences for receiving notifications.
 */
export interface NotificationPreferences {
  /** Indicates if notifications are enabled */
  enabled: boolean;
  /** How often notifications should be sent */
  frequency: FrequencyType;
}

/**
 * Combines user preferences and settings for notifications.
 */
export interface NotificationSettings {
  /** General notification preferences */
  preferences: NotificationPreferences;
  /** Channel-specific notification settings */
  settings: UserNotificationSettings;
}

/**
 * Represents a single notification entity.
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Category of the notification */
  type: NotificationType;
  /** Short summary of the notification */
  title: string;
  /** Detailed content of the notification */
  message: string;
  /** Indicates whether the notification has been read */
  read: boolean;
  /** When the notification was created or last updated */
  timestamp: string;
}

/**
 * Represents the entire state of the notification system.
 */
export interface NotificationState {
  /** List of all notifications */
  notifications: Notification[];
  /** User's notification settings */
  settings: NotificationSettings;
}

/**
 * Props for the NotificationContext provider component.
 */
export interface NotificationContextProps {
  /** Current state of the notification system */
  state: NotificationState;
  /** Function to update the notification state */
  dispatch: React.Dispatch<NotificationAction>;
}

/**
 * Props for the NotificationProvider component.
 */
export interface NotificationProviderProps {
  /** Child components to be wrapped by the provider */
  children: React.ReactNode;
}

/**
 * Props for individual Notification components.
 */
export interface NotificationProps {
  /** The notification to be displayed */
  notification: Notification;
}

/**
 * Props for the NotificationSettings component.
 */
export interface NotificationSettingsProps {
  /** Current notification settings */
  settings: NotificationSettings;
  /** Callback function to update settings */
  onSettingsChange: (newSettings: Partial<NotificationSettings>) => void;
}