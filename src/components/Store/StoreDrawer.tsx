// src/components/Store/StoreDrawer.tsx

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StoreLayout from './StoreLayout';
import { StoreItem } from './types/store';

interface StoreDrawerProps {
  open: boolean;
  onClose: () => void;
}

const StoreDrawer: React.FC<StoreDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const storeData = {
    categories: [
      {
        title: "Additional Features",
        items: [
          {
            type: 'feature',
            title: 'Family',
            description: 'Create tasks for your children, manage their time and monitor their well-being',
            price: { amount: 58, currency: '$', period: 'month' },
            image: '/images/store/family-feature.png',
          },
          // ... other items
        ] as StoreItem[]
      },
      // ... other categories (Color Palettes, App Styles, Personal Analytics, Spotify Playlists, Bundles)
    ]
  };

  return (
    <Drawer
      anchor={isDesktop ? 'right' : 'bottom'}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isDesktop ? '400px' : '100%',
          height: isDesktop ? '100%' : '80%',
          maxHeight: isDesktop ? '100%' : '80%',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">EN Store</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="subtitle2" gutterBottom>
          Enhance your emotional journey with our premium features and add-ons.
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <StoreLayout categories={storeData.categories} isDrawer={true} />
      </Box>
    </Drawer>
  );
};

export default StoreDrawer;