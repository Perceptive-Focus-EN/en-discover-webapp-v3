import React, { useEffect, useState } from 'react';
import { Badge } from '@mui/material';
import { useNotification } from './contexts/NotificationContext';

interface NotificationBadgeProps {
  icon: React.ReactNode;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ icon }) => {
  const { unreadCount } = useNotification();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{icon}</>;
  }

  return (
    <Badge
      badgeContent={unreadCount > 99 ? '99+' : unreadCount} 
      color="error"
      showZero
    >
      {icon}
    </Badge>
  );
};

export default NotificationBadge;