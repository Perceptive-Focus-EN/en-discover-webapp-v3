// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authorizationApi } from '../lib/api_s/authorization';
import { onboardingApi } from '../lib/api_s/onboarding';
import { userApi } from '../lib/api_s/user';
import { LoginRequest } from '../types/Login/interfaces';
import { SignupRequest } from '../types/Signup/interfaces';
import { frontendLogger } from '../utils/ErrorHandling/frontendLogger';
import * as authManager from '../utils/TokenManagement/authManager';
import { ExtendedUserInfo } from '../types/User/interfaces';
import { OnboardingStepRequest, OnboardingStatusDetails } from '../types/Onboarding/interfaces';
import axiosInstance from '@/lib/axiosSetup';
import { API_ENDPOINTS } from '@/constants/endpointsConstants';
import { TenantInfo } from '@/types/Tenant/interfaces';

interface AuthContextType {
  user: ExtendedUserInfo | null;
  loading: boolean;
  error: string | null;
  onboardingStatus: OnboardingStatusDetails | null;
  signup: (data: SignupRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateOnboardingStep: (data: OnboardingStepRequest) => Promise<void>;
  setError: (error: string | null) => void;
  setUser: (userData: ExtendedUserInfo | null) => void;
  verifyMagicLink: (token: string) => Promise<boolean>;
  requestMagicLink: (email: string) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  joinTenant: (tenantId: string) => Promise<void>;
  getUserTenants: () => Promise<TenantInfo[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusDetails | null>(null);
  const [user, setUser] = useState<ExtendedUserInfo | null>(() => {
    const storedUser = authManager.getStoredUser();
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshUser();
      } catch (err) {
        frontendLogger.error('Failed to initialize auth', 'Error refreshing user data', err as Record<string, unknown>);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setUserAndStore = (userData: ExtendedUserInfo | null) => {
    setUser(userData);
    if (userData) {
      authManager.storeUser(JSON.stringify(userData));
    } else {
      authManager.clearStoredUser();
    }
  };

  const refreshUser = async () => {
  try {
    const refreshedTokens = await authManager.refreshTokens();
    if (refreshedTokens) {
      const userData = await userApi.getCurrentUser();
      setUserAndStore(userData);
      setOnboardingStatus(userData.onboardingStatus as unknown as OnboardingStatusDetails | null);
      frontendLogger.info(
        'Refreshed user data',
        'Your account information has been updated',
        { userId: userData.userId, onboardingStatus: userData.onboardingStatus }
      );
    } else {
      throw new Error('Failed to refresh tokens');
    }
  } catch (err) {
    setUserAndStore(null);
    setOnboardingStatus(null);
    setError('Failed to fetch user data');
    frontendLogger.error(
      'Failed to fetch user data',
      'We couldn\'t retrieve your account information. Please try logging in again.',
      err as Record<string, unknown>
    );
    throw err;
  }
};

const logout = async () => {
  setLoading(true);
  try {
    await authManager.logout();
    setUserAndStore(null);
    setOnboardingStatus(null);
    setError(null);
    frontendLogger.info(
      'User logged out',
      'You\'ve been logged out successfully. See you soon!',
      {}
    );
    router.push('/login');
  } catch (error) {
    frontendLogger.error(
      'Logout failed',
      'We encountered an issue while logging you out. Please try again.',
      { error }
    );
    setError('Logout failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const signup = async (data: SignupRequest) => {
  try {
    const response = await authorizationApi.signup(data);
    frontendLogger.info(
      'User signed up successfully',
      'Welcome! Your account has been created successfully.',
      { userId: response.user.userId }
    );
    // Don't set tokens here
    // Instead, you might want to redirect to login page or show a "verify your email" message
    router.push('/login');
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
    setError(errorMessage);
    frontendLogger.error(
      'Signup error',
      'We encountered an issue while creating your account. Please try again.',
      { error: errorMessage }
    );
    throw err;
  }
  };

  const verifyMagicLink = async (token: string): Promise<boolean> => {
    try {
      const response = await authManager.verifyMagicLink(token);
      if (response && response.user) {
        setUserAndStore(response.user);
        setOnboardingStatus(response.user.onboardingStatus as unknown as OnboardingStatusDetails | null);
        frontendLogger.info(
          'Magic link verified',
          'You have been signed in successfully using the magic link.',
          { userId: response.user.userId }
        );
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      frontendLogger.error(
        'Magic link verification error',
        'We couldn\'t sign you in using the magic link. Please try again.',
        { token, error: err }
      );
      setError('Failed to verify magic link. Please try again.');
      throw err;
    }
  };

  const requestMagicLink = async (email: string) => {
    try {
      await axiosInstance.post(API_ENDPOINTS.REQUEST_MAGIC_LINK, { email });
      frontendLogger.info(
        'Magic link requested',
        'We\'ve sent you a magic link. Check your email to sign in.',
        { email }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      frontendLogger.error(
        'Magic link request error',
        'We couldn\'t send you a magic link. Please try again.',
        { email, error: errorMessage }
      );
      throw err;
    }
  };

  const login = async (loginData: LoginRequest) => {
  try {
    console.log('Sending login request with data:', loginData);
    const response = await authorizationApi.login(loginData);
    console.log('Received login response:', response);
    if (response && response.user) {
      authManager.setTokens(response.accessToken, response.refreshToken, response.sessionId);
      setUserAndStore(response.user);
      frontendLogger.info(
        'User logged in successfully',
        'Welcome back! You\'ve been logged in successfully.',
        { userId: response.user.userId }
      );

      if (response.onboardingComplete) {
        router.push('/moodboard');
      } else {
        router.push('/onboarding');
      }
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (err) {
    console.error('Login error in AuthContext:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    setError(errorMessage);
    frontendLogger.error(
      'Login error',
      'We couldn\'t log you in. Please check your credentials and try again.',
      { error: errorMessage }
    );
  }
};

  const updateOnboardingStep = async (data: OnboardingStepRequest) => {
    try {
      frontendLogger.info(
        'Updating onboarding step',
        'Saving your onboarding progress...',
        data as unknown as Record<string, unknown>
      );
      const response = await onboardingApi.updateOnboardingStep(data);
      frontendLogger.info(
        'Onboarding step updated',
        'Your progress has been saved successfully',
        response as unknown as Record<string, unknown>
      );
      setUserAndStore(response.user);
      setOnboardingStatus(response.user ? response.user.onboardingStatus as OnboardingStatusDetails | null : null);
    } catch (err) {
      frontendLogger.error(
        'Onboarding update error',
        'We couldn\'t save your onboarding progress. Please try again.',
        err as Record<string, unknown>
      );
      setError('Failed to update onboarding step. Please try again.');
      throw err;
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const updatedUser = await userApi.switchTenant(tenantId);
      setUserAndStore(updatedUser);
      frontendLogger.info(
        'Switched tenant',
        'Your active tenant has been switched successfully',
        { userId: updatedUser.userId, tenantId }
      );
    } catch (err) {
      frontendLogger.error(
        'Failed to switch tenant',
        'We couldn\'t switch your active tenant. Please try again.',
        err as Record<string, unknown>
      );
      setError('Failed to switch tenant. Please try again.');
    }
  };

  const joinTenant = async (tenantId: string) => {
    try {
      const updatedUser = await userApi.joinTenant(tenantId);
      setUserAndStore(updatedUser);
      frontendLogger.info(
        'Joined new tenant',
        'You have successfully joined a new tenant',
        { userId: updatedUser.userId, tenantId }
      );
    } catch (err) {
      frontendLogger.error(
        'Failed to join tenant',
        'We couldn\'t add you to the new tenant. Please try again.',
        err as Record<string, unknown>
      );
      setError('Failed to join tenant. Please try again.');
    }
  };

  const getUserTenants = async () => {
    try {
      const tenants = await userApi.getUserTenants();
      return tenants;
    } catch (err) {
      frontendLogger.error(
        'Failed to fetch user tenants',
        'We couldn\'t retrieve your tenants. Please try again.',
        err as Record<string, unknown>
      );
      setError('Failed to fetch user tenants. Please try again.');
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      onboardingStatus,
      signup,
      login,
      verifyMagicLink,
      requestMagicLink,
      logout,
      refreshUser,
      updateOnboardingStep,
      setError,
      setUser: setUserAndStore,
      switchTenant,
      joinTenant,
      getUserTenants,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};