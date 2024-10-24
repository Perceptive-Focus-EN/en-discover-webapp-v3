// src/components/Auth/MagicLinkVerification.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const MagicLinkVerification: React.FC = () => {
  const router = useRouter();
  const { verifyMagicLink } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const verifyToken = useCallback(async (token: string) => {
    await verifyMagicLink(token);
    router.push('/AccessKeyCreationPage');
    setIsVerifying(false);
  }, [verifyMagicLink, router]);

  useEffect(() => {
    setIsClient(true);
    const { token } = router.query;
    if (token && typeof token === 'string') {
      verifyToken(token);
    } else if (isClient) {
      setIsVerifying(false);
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

  return null;
};

export default MagicLinkVerification;
