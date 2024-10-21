// src/components/Store/StoreRow.tsx

import React, { useRef } from 'react';
import { Box, Typography, IconButton, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import StoreItem from './StoreItem';
import { StoreItem as StoreItemType } from './types/store';

interface StoreRowProps {
  title: string;
  items: StoreItemType[];
  isDrawer?: boolean;
}

const StoreRow: React.FC<StoreRowProps> = ({ title, items, isDrawer = false }) => {
  const theme = useTheme();
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (scrollOffset: number) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
      <Box sx={{ position: 'relative' }}>
        {!isDrawer && (
          <IconButton
            onClick={() => scroll(-200)}
            sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
          >
            <ChevronLeft />
          </IconButton>
        )}
        <Box
          ref={rowRef}
          sx={{
            display: 'flex',
            flexDirection: isDrawer ? 'column' : 'row',
            overflowX: isDrawer ? 'visible' : 'auto',
            overflowY: isDrawer ? 'auto' : 'visible',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            gap: 2,
            p: 1,
          }}
        >
          {items.map((item, index) => (
            <StoreItem key={index} item={item} isDrawer={isDrawer} />
          ))}
        </Box>
        {!isDrawer && (
          <IconButton
            onClick={() => scroll(200)}
            sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}
          >
            <ChevronRight />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default StoreRow;