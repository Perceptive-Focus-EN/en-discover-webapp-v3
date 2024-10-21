import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import PersistentBottomSheet from './PersistentBottomSheet';

interface ColorControlledPageProps {
  backgroundColor: string;
  buttonColor: string;
  hoverColor: string;
}

const ColorControlledPage: React.FC<ColorControlledPageProps> = ({
  backgroundColor,
  buttonColor,
  hoverColor,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: backgroundColor,
        minHeight: '100vh',
        padding: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography variant="h4" sx={{ color: '#fff', mb: 3 }}>
        Pick color for today
      </Typography>
      <Button
        sx={{
          backgroundColor: buttonColor,
          color: '#fff',
          '&:hover': {
            backgroundColor: hoverColor,
          },
          mb: 3,
        }}
      >
        Click Me
      </Button>
      <PersistentBottomSheet buttonColor={buttonColor} children={<Container>Content</Container>} />
    </Box>
  );
};

export default ColorControlledPage;
