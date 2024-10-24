// src/components/Auth/Logout.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Typography, Box, CircularProgress } from '@mui/material';

const Logout: React.FC = () => {
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Are you sure you want to log out?
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleLogout}
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Log Out'}
      </Button>
    </Box>
  );
};

export default Logout;
