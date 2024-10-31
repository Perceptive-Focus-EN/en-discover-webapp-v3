import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';

const Logout: React.FC = () => {
  const { logout, loading } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Clear local storage first to prevent auto-refresh attempts
      localStorage.clear();
      sessionStorage.clear();
      
      // Perform logout
      await logout();
      
      // Force router navigation after cleanup
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect on error
      router.replace('/login');
    }
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
        disabled={loading || isLoggingOut}
        sx={{ mt: 2 }}
      >
        {(loading || isLoggingOut) ? <CircularProgress size={24} color="inherit" /> : 'Log Out'}
      </Button>
    </Box>
  );
};

export default Logout;