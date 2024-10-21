import React from 'react';
import { Box, Typography, Link, styled } from '@mui/material';
import NextLink from 'next/link';
import LoginForm from '../components/Auth/LoginForm';
import { LoginRequest } from '../types/Login/interfaces';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const CenteredBox = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
  boxShadow: 'none', // Ensure no shadow is applied
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },

}));


const LoginPage: React.FC = () => {
  const { login, requestMagicLink, error, loading, setError } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (formData: LoginRequest) => {
    try {
      await login(formData);
      router.push('/'); // Redirect to home page after successful login
    } catch (err) {
      // Error handling is done in the AuthContext
    }
  };

  const handleMagicLinkRequest = async (email: string) => {
    try {
      await requestMagicLink(email);
      // You might want to show a success message here
    } catch (err) {
      // Error handling is done in the AuthContext
    }
  };

  const handleSignupClick = () => {
    router.push('/signup'); // Redirect to signup page
  };

  return (
    <CenteredBox>
      <LoginForm
        onSubmit={handleLoginSubmit}
        onMagicLinkRequest={handleMagicLinkRequest}
        loading={loading}
        error={error}
        onErrorClose={() => setError(null)}
      />
      <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
      Don't have an account?{' '}
      <Link 
        component="a" 
        color="primary" 
        underline="hover"
        onClick={handleSignupClick}
        style={{ cursor: 'pointer' }}
      >
        Sign up here
      </Link>
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
        By continuing, you agree to our{' '}
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
    </CenteredBox>
  );
};

export default LoginPage;
