import React from 'react';
import { Box, Typography, Checkbox } from '@mui/material';

const CheckBoxComponent: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Checkbox />
      <Typography variant="body2" sx={{ color: 'gray' }}>
        Share with friends into feed
      </Typography>
    </Box>
  );
};

export default CheckBoxComponent;
