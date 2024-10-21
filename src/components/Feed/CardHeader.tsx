// src/components/Feed/CardHeader.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import AvatarComponent from '../Uploads/AvatarComponent';

// Utility function to format the timestamp
const formatTimestamp = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return `${interval} years ago`;
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return `${interval} months ago`;
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return `${interval} days ago`;
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return `${interval} hours ago`;
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return `${interval} minutes ago`;
  }
  return `${Math.floor(seconds)} seconds ago`;
};

interface CardHeaderProps {
  userId: string;
  username: string;
  userAvatar: string;
  timestamp: string;
  firstName?: string;
  lastName?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  username, 
  userAvatar, 
  timestamp, 
  firstName, 
  lastName 
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      p: 2,
      borderBottom: 1,
      borderColor: 'divider'
    }}>
      <AvatarComponent 
        user={{
          avatarUrl: userAvatar,
          firstName,
          lastName
        }}
        size={40}
      />
      <Box sx={{ ml: 2 }}>
        <Typography variant="subtitle2">{username}</Typography>
        <Typography variant="caption" color="text.secondary">{formatTimestamp(timestamp)}</Typography>
      </Box>
    </Box>
  );
};