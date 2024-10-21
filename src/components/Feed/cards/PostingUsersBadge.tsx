// src/components/Feed/UserTypeBadge.tsx
import React from 'react';
import { Chip } from '@mui/material';
import { UserAccountTypeEnum } from '../../../constants/AccessKey/accounts';

interface UserTypeBadgeProps {
  userType: UserAccountTypeEnum;
}

interface UserTypeBadgeProps {
  userType: UserAccountTypeEnum;
}

const getUserTypeColor = (userType: UserAccountTypeEnum): string => {
  switch (userType) {
    case UserAccountTypeEnum.PATIENT:
      return '#4CAF50'; // Green
    case UserAccountTypeEnum.OVERSEER:
      return '#2196F3'; // Blue
    case UserAccountTypeEnum.INSTITUTE:
      return '#FFC107'; // Amber
    case UserAccountTypeEnum.BUSINESS:
      return '#FF9800'; // Orange
    case UserAccountTypeEnum.FAMILY:
      return '#FF5722'; // Deep Orange
    case UserAccountTypeEnum.FRIEND:
      return '#E91E63'; // Pink
    case UserAccountTypeEnum.OTHER:
      return '#9C27B0'; // Purple
    default:
      return '#000000'; // Black
  }
};

export const UserTypeBadge: React.FC<UserTypeBadgeProps> = ({ userType }) => {
  return (
    <Chip
      label={userType}
      size="small"
      sx={{
        backgroundColor: getUserTypeColor(userType),
        color: 'white',
        fontWeight: 'bold',
      }}
    />
  );
};