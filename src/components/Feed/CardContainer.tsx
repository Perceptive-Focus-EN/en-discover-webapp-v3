// src/components/Feed/CardContainer.tsx
import React from 'react';
import { Box } from '@mui/material';

interface CardContainerProps {
  children: React.ReactNode;
}

export const CardContainer: React.FC<CardContainerProps> = ({ children }) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 400,
        minHeight: 400, // Changed from fixed height to minHeight
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        mb: 3, // Margin bottom for spacing between cards
      }}
    >
      {children}
    </Box>
  );
};