// pages/profile.tsx
import React from 'react';
import { NextPage } from 'next';
import Profile from '../components/Profile';
import { useAuth } from '../contexts/AuthContext';
import { Container, Typography } from '@mui/material';

const ProfilePage: NextPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Typography variant="h6">User not authenticated. Please log in.</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Profile />
    </Container>
  );
};

export default ProfilePage;
