import React, { useState, useCallback, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Grid, 
  IconButton, 
  InputAdornment, 
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Box,
  styled,
  Paper,
  Fade,
  Snackbar,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { LoginRequest } from '../../types/Login/interfaces';
import { frontendLogger } from '../../utils/ErrorHandling/frontendLogger';
import VideoLogoWithBackgroundRemoval from './VideoLogoWithBackgroundRemoval';

const StyledPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: '450px',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  background: 'none', // Remove background
  boxShadow: 'none', // Remove drop shadow
  transition: 'none', // Disable hover transition
  '&:hover': {
    boxShadow: 'none', // Ensure no hover shadow
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}));

const VideoLogoContainer = styled('div')(({ theme }) => ({
  width: '90px',
  height: '90px',
  overflow: 'hidden',
  borderRadius: '50%',
  margin: '0 auto',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    width: '120px',
    height: '120px',
    marginBottom: theme.spacing(4),
  },
  [theme.breakpoints.up('md')]: {
    width: '140px',
    height: '140px',
    marginBottom: theme.spacing(5),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  height: '48px',
  borderRadius: '24px',
}));

interface LoginFormProps {
  onSubmit: (formData: LoginRequest) => void;
  onMagicLinkRequest: (email: string) => void;
  loading: boolean;
  error: string | null;
  onErrorClose: () => void;
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onMagicLinkRequest, loading, error, onErrorClose, onSuccess }) => {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isMagicLinkRequested, setIsMagicLinkRequested] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    frontendLogger.info('Login form loaded', 'Please enter your credentials to sign in');
    return () => {
      frontendLogger.info('Login form unloaded', 'Thank you for using our login form');
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleMagicLinkRequest = () => {
    if (!formData.email) {
      frontendLogger.warn('Email missing', 'Please enter your email address');
      onErrorClose();
      return;
    }
    onMagicLinkRequest(formData.email);
    setIsMagicLinkRequested(true);
    setFormData(prev => ({ ...prev, password: '' }));
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  if (!isClient) {
    return <CircularProgress />;
  }

  return (
    <Fade in={true} timeout={800}>
      <StyledPaper>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <VideoLogoContainer>
            <VideoLogoWithBackgroundRemoval />
          </VideoLogoContainer>
          <Typography
            variant="h2"
            sx={{
              mb: { xs: 1, sm: 2 },
              textAlign: 'center',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              fontWeight: 'bold',
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              mb: { xs: 2, sm: 3 },
              opacity: 0.8,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            Please sign in to your account
          </Typography>
        </Box>
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                type="email"
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="email"
              />
            </Grid>
            {!isMagicLinkRequested && (
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={togglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <StyledButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
              >
                {isMagicLinkRequested ? 'Check Email for Magic Link' : 'Sign In'}
              </StyledButton>
            </Grid>
            <Grid item xs={12}>
              <StyledButton
                fullWidth
                variant="outlined"
                onClick={handleMagicLinkRequest}
                disabled={loading}
              >
                {isMagicLinkRequested ? 'Resend Magic Link' : 'Sign in with Magic Link'}
              </StyledButton>
            </Grid>
          </Grid>
        </form>
        {error && (
          <Snackbar open={!!error} autoHideDuration={6000} onClose={onErrorClose}>
            <Alert onClose={onErrorClose} severity="error">
              {error}
            </Alert>
          </Snackbar>
        )}
      </StyledPaper>
    </Fade>
  );
};

export default LoginForm;