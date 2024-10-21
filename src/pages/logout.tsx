// src/pages/logout.tsx
import React from 'react';
import { NextPage } from 'next';
import Logout from '../components/Auth/Logout';
import { Container, Paper, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const LogoutPage: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is not logged in
  React.useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3}>
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 3,
          }}
        >
          <Logout />
        </Box>
      </Paper>
    </Container>
  );
};

export default LogoutPage;