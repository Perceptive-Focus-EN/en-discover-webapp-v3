// src/components/Layout/SocialMediaLayout.tsx

import React from 'react';
import { Box, Container, Grid, Paper, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

interface SocialMediaLayoutProps {
  children: React.ReactNode;
}

const SocialMediaLayout: React.FC<SocialMediaLayoutProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {children}
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                {/* Add trending topics, suggestions, or other sidebar content */}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default SocialMediaLayout;