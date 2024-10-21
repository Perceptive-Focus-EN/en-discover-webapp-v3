// src/components/Auth/Logout.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { frontendLogger } from '../../utils/ErrorHandling/frontendLogger';

const Logout: React.FC = () => {
  const { logout, error: contextError, loading } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      // Note: We don't need to log here as it's already being done in the AuthContext
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during logout';
      setLocalError(errorMessage);
      frontendLogger.error('Logout failed', errorMessage, { error: err });
    }
  };

  const error = contextError || localError;

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
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default Logout;