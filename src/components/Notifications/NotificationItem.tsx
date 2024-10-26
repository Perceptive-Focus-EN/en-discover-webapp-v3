// NotificationItem.tsx
import React from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip, Fade } from '@mui/material';
import { Notification } from './types/notification';
import { formatDistanceToNow } from 'date-fns';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const handleMarkAsRead = async () => {
    try {
      await onMarkAsRead(notification.id);
    } catch (error) {
      messageHandler.error('Failed to mark notification as read');
    }
  };

  const handleOptionsClick = () => {
    // Future implementation for options menu
    messageHandler.info('Options menu coming soon');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        mb: 1,
        p: 1.5,
        bgcolor: notification.read ? 'background.default' : 'action.hover',
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Avatar src={notification.userAvatar} sx={{ mr: 2, width: 40, height: 40 }}>
        {notification.badge && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              bgcolor: notification.badge.color,
              borderRadius: '50%',
              border: '2px solid #fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(notification.badge.icon as React.ReactElement, { fontSize: 'inherit' })}
          </Box>
        )}
      </Avatar>
      <Box sx={{ flexGrow: 1, mr: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {!notification.read && (
          <Tooltip title="Mark as read" placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
            <IconButton size="small" onClick={handleMarkAsRead}>
              <CheckCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="More options" placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
          <IconButton size="small" onClick={handleOptionsClick}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default NotificationItem;