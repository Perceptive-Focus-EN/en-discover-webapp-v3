// src/components/Store/StoreLayout.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import StoreRow from './StoreRow';
import { StoreItem } from './types/store';

interface StoreLayoutProps {
  categories: {
    title: string;
    items: StoreItem[];
  }[];
  isDrawer?: boolean;
}

const StoreLayout: React.FC<StoreLayoutProps> = ({ categories, isDrawer = false }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {categories.map((category, index) => (
        <Box key={index}>
          <Typography variant={isDrawer ? "h6" : "h5"} gutterBottom>
            {category.title}
          </Typography>
          <StoreRow title={category.title} items={category.items} isDrawer={isDrawer} />
        </Box>
      ))}
    </Box>
  );
};

export default StoreLayout;