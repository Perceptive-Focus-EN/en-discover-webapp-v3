// src/components/profile-addons/ProfileSkeleton.tsx

import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const ProfileSkeleton: React.FC = () => {
  return (
    <Box>
      <Skeleton variant="circular" width={80} height={80} />
      <Skeleton variant="text" width="60%" height={40} />
      <Skeleton variant="text" width="80%" height={30} />
      <Skeleton variant="rectangular" width="100%" height={200} />
    </Box>
  );
};

export default ProfileSkeleton;
