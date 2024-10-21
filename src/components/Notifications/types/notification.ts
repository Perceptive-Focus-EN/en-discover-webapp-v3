// src/types/notification.ts

// src/types/notification.ts

import { ReactNode } from 'react';

  export type NotificationType =
    | 'friend_request'
    | 'birthday'
    | 'system_update'
    | 'like'
    | 'group_invite'
    | 'profile_view'
    | 'message'
    | 'achievement'
    | 'membership'
    | 'new_content'
    | 'mentor_request'
    | 'reaction'
    | 'family_request'
    | 'group_connection'
    | 'overseer_connection'
    | 'message_received'
    | 'mood_reminder'
    | 'subscription_update'
    | 'resource_recommendation';

export interface NotificationBadge {
  type: NotificationType;
  color: string;
  icon: ReactNode;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: Date;
  read: boolean;
  badge: NotificationBadge;
  actions?: NotificationAction[];
  targetId?: string;
  expiresAt?: Date;
  additionalData?: {
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  userId: string;
  enabledTypes: NotificationType[];
  emailNotifications: boolean;
  pushNotifications: boolean;
}
