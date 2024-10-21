// src/components/Notifications/NotificationSection.tsx

import React from 'react';
import { Box } from '@mui/material';
import NotificationItem from './NotificationItem';
import { Notification } from './types/notification';

interface NotificationSectionProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({ notifications, onMarkAsRead }) => {
  return (
    <Box>
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} onMarkAsRead={onMarkAsRead} />
      ))}
    </Box>
  );
};

export default NotificationSection;