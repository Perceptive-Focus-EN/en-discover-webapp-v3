// src/components/Store/StoreItem.tsx

import React from 'react';
import { Box, Typography, Button, useTheme, Paper, Avatar } from '@mui/material';
import { StoreItem as StoreItemType } from '../../components/Store/types/store';

interface StoreItemProps {
    item: StoreItemType;
    isDrawer?: boolean;

}

const StoreItem: React.FC<StoreItemProps> = ({ item, isDrawer = false }) => {
  const theme = useTheme();

  const renderContent = () => {
    switch (item.type) {
      case 'feature':
        return <FeatureItem item={item} />;
      case 'colorPalette':
        return <ColorPaletteItem item={item} />;
      case 'spotify':
        return <SpotifyItem item={item} />;
      case 'bundle':
        return <BundleItem item={item} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: 250, flexShrink: 0 }}>
      {renderContent()}
    </Box>
  );
};

// Subcomponents for different item types
const FeatureItem: React.FC<{ item: StoreItemType }> = ({ item }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        height: 240,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          height: '50%',
          background: `linear-gradient(to bottom, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img src={item.image} alt={item.title} style={{ maxWidth: '60%', maxHeight: '60%' }} />
      </Box>
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>{item.title}</Typography>
        <Typography variant="body2" color="text.secondary">{item.description}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {item.price.currency}{item.price.amount}/{item.price.period}
          </Typography>
          <Button variant="contained" size="small">Unlock</Button>
        </Box>
      </Box>
    </Paper>
  );
};

const ColorPaletteItem: React.FC<{ item: StoreItemType }> = ({ item }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        height: 240,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          height: '60%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          p: 2,
          background: theme.palette.background.default,
        }}
      >
        {[...Array(8)].map((_, index) => (
          <Avatar
            key={index}
            sx={{
              bgcolor: `hsl(${index * 45}, 70%, 50%)`,
              width: '100%',
              height: '100%',
            }}
          />
        ))}
      </Box>
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography variant="h6">{item.title}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {item.price.currency}{item.price.amount}/{item.price.period}
          </Typography>
          <Button variant="contained" size="small">Unlock</Button>
        </Box>
      </Box>
    </Paper>
  );
};

const SpotifyItem: React.FC<{ item: StoreItemType }> = ({ item }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        height: 320,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          height: '60%',
          background: `linear-gradient(to bottom, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img src={item.image} alt={item.title} style={{ maxWidth: '80%', maxHeight: '80%', opacity: 0.7 }} />
      </Box>
      <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="secondary">{item.title}</Typography>
        <Typography variant="body2" color="text.secondary">{item.description}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="secondary">
            {item.price.currency}{item.price.amount}/{item.price.period}
          </Typography>
          <Button variant="contained" color="secondary" size="small">Unlock</Button>
        </Box>
      </Box>
    </Paper>
  );
};

const BundleItem: React.FC<{ item: StoreItemType }> = ({ item }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={3}
      sx={{
        height: 480,
        width: 388,
        borderRadius: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: `linear-gradient(to bottom, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
      }}
    >
      <Typography variant="h5" sx={{ color: 'white', textAlign: 'center', mt: 2 }}>
        {item.title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'white', textAlign: 'center', px: 3, mt: 1 }}>
        {item.description}
      </Typography>
      <Box sx={{ position: 'relative', height: '50%', mt: 2 }}>
        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Add Spotify and other icons here */}
      </Box>
      <Box sx={{ p: 3, mt: 'auto' }}>
        <Typography variant="subtitle1" sx={{ color: 'white', textAlign: 'center', mb: 2 }}>
          {item.price.currency}{item.price.amount} {item.price.period === 'one-time' ? 'one time' : `/${item.price.period}`}
          {item.recurringPrice && ` + ${item.recurringPrice.currency}${item.recurringPrice.amount}/${item.recurringPrice.period} after the year`}
        </Typography>
        <Button
          variant="contained"
          fullWidth
          sx={{
            bgcolor: 'white',
            color: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.grey[100],
            },
          }}
        >
          Unlock bundle
        </Button>
      </Box>
    </Paper>
  );
};

export default StoreItem;