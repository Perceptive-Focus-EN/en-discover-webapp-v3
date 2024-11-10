// src/pages/signup.tsx
import React from 'react';
import { NextPage } from 'next';
import { Typography, Box, Link, useMediaQuery, Theme } from '@mui/material';
import SignupForm from '../components/Auth/SignupForm';
import NextLink from 'next/link';

const SignupPage: NextPage = () => {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        marginTop: isMobile ? 4 : 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? 2 : 3,
      }}
    >
      <Typography component="h1" variant="h5" gutterBottom>
        Sign Up
      </Typography>
      <SignupForm />
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          Already have an account?{' '}
          <NextLink href="/login" passHref>
            <Link component="a" color="primary" underline="hover">
              Log in here
            </Link>
          </NextLink>
        </Typography>
      </Box>
      <Typography
        variant="body2"
        align="center"
        sx={{
          fontSize: '0.75rem',
          mt: 2,
          opacity: 0.7,
        }}
      >
        By signing up, you agree to our{' '}
        <NextLink href="/terms" passHref>
          <Link component="a" color="primary" underline="hover">
            Terms of Service
          </Link>
        </NextLink>{' '}
        and{' '}
        <NextLink href="/privacy" passHref>
          <Link component="a" color="primary" underline="hover">
            Privacy Policy
          </Link>
        </NextLink>
      </Typography>
    </Box>
  );
};

export default SignupPage;
