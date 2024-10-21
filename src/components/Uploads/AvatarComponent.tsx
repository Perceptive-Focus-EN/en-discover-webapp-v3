import React from 'react';
import { Avatar } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface AvatarComponentProps {
  size?: number;
  user?: {
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
  };
}

const AvatarComponent: React.FC<AvatarComponentProps> = ({ size = 40, user }) => {
  const { user: authUser } = useAuth();
  
  const avatarUser = user || authUser || {};
  
  const { avatarUrl, firstName, lastName } = avatarUser as { avatarUrl?: string; firstName?: string; lastName?: string };
  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}` : undefined;

  const avatarSrc = avatarUrl || '/default-avatar.png';

  return (
    <Avatar
      src={avatarSrc}
      alt={initials || 'User Avatar'}
      sx={{ width: size, height: size }}
    >
      {!avatarSrc && initials}
    </Avatar>
  );
};

export default AvatarComponent;