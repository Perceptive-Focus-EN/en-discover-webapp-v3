// src/components/Auth/MagicLinkVerification.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Typography, CircularProgress } from '@mui/material';
import { frontendLogger } from '../../utils/ErrorHandling/frontendLogger';

const MagicLinkVerification: React.FC = () => {
  const router = useRouter();
  const { verifyMagicLink } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const verifyToken = useCallback(async (token: string) => {
    try {
      await verifyMagicLink(token);
      frontendLogger.info('Magic link verified', 'Successfully verified magic link');
      router.push('/AccessKeyCreationPage');
    } catch (err) {
      setError('Failed to verify magic link. Please try again.');
      frontendLogger.error('Magic link verification failed', 'Error verifying magic link', { error: err });
    } finally {
      setIsVerifying(false);
    }
  }, [verifyMagicLink, router]);

  useEffect(() => {
    setIsClient(true);
    const { token } = router.query;
    if (token && typeof token === 'string') {
      verifyToken(token);
    } else if (isClient) {
      setIsVerifying(false);
      setError('Invalid or missing token.');
    }
  }, [router.query, verifyToken, isClient]);

  if (!isClient) {
    return null;
  }

  if (isVerifying) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return null;
};

export default MagicLinkVerification;