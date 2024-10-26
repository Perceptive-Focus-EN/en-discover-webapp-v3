// NotificationBadge.tsx
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
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <>{icon}</>;
  }

  return (
    <Badge
      badgeContent={unreadCount > 99 ? '99+' : unreadCount}
      color="error"
      showZero
      sx={{
        '& .MuiBadge-badge': {
          animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.1)' },
            '100%': { transform: 'scale(1)' },
          },
        },
      }}
    >
      {icon}
    </Badge>
  );
};

export default NotificationBadge;