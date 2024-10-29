import React from 'react';
import { Typography, Avatar, Box, Button, Tooltip } from '@mui/material';
import { styled } from '@mui/system';

interface UserProfileProps {
  user: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    isValidated?: boolean; // New prop to determine if the account is validated
  };
}

// Styled component for the halo effect
const ValidationHalo = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: -4,
  left: -4,
  right: -4,
  bottom: -4,
  borderRadius: '50%',
  background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF8C00, #FFD700)',
  animation: 'rotate 3s linear infinite',
  '@keyframes rotate': {
    '0%': {
      transform: 'rotate(0deg)',
    },
    '100%': {
      transform: 'rotate(360deg)',
    },
  },
}));

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box position="relative" mb={2}>
        {user.isValidated && (
          <Tooltip title="Validated Account" arrow>
            <ValidationHalo />
          </Tooltip>
        )}
        <Avatar
          src={user.avatarUrl}
          sx={{ 
            width: 80, 
            height: 80, 
            border: user.isValidated ? '4px solid white' : 'none',
            position: 'relative',
            zIndex: 1,
          }}
        />
      </Box>
      <Typography variant="h6">{`${user.firstName} ${user.lastName}`}</Typography>
      <Button variant="outlined" sx={{ mt: 2 }}>Edit Profile</Button>
    </Box>
  );
};

export default UserProfile;