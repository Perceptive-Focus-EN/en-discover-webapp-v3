import React from 'react';
import { Typography, Link, styled } from '@mui/material';
import NextLink from 'next/link';
import LoginForm from '../components/Auth/LoginForm';
import { LoginRequest } from '../types/Login/interfaces';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

const CenteredBox = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(2),
  boxShadow: 'none',
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

const LoginPage: React.FC = () => {
  const { login, requestMagicLink, loading } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (formData: LoginRequest) => {
    await login(formData);
    // No redirection after login
  };

  const handleMagicLinkRequest = async (email: string) => {
    await requestMagicLink(email);
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
      />
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
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
      </div>
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Typography variant="body2" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
          By continuing, you agree to our{' '}
          <NextLink href="/settings/terms" passHref>
            <Link color="primary" underline="hover">Terms of Service</Link>
          </NextLink>{' '}
          and{' '}
          <NextLink href="/settings/privacy-policy" passHref>
            <Link color="primary" underline="hover">Privacy Policy</Link>
          </NextLink>
          . Need help? Visit our{' '}
          <NextLink href="/settings/faq" passHref>
            <Link color="primary" underline="hover">FAQ</Link>
          </NextLink>.
        </Typography>
      </div>
    </CenteredBox>
  );
};

export default LoginPage; // No authentication checks applied, ensuring this is a public page
