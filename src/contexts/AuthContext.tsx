// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authorizationApi } from '../lib/api_s/authorization';
import { onboardingApi } from '../lib/api_s/onboarding';
import { userApi } from '../lib/api_s/user';
import { LoginRequest } from '../types/Login/interfaces';
import { SignupRequest } from '../types/Signup/interfaces';
import * as authManager from '../utils/TokenManagement/authManager';
import { ExtendedUserInfo } from '../types/User/interfaces';
import { OnboardingStepRequest, OnboardingStatusDetails } from '../types/Onboarding/interfaces';
import { TenantInfo } from '@/types/Tenant/interfaces';

interface AuthContextType {
  user: ExtendedUserInfo | null;
  loading: boolean;
  onboardingStatus: OnboardingStatusDetails | null;
  signup: (data: SignupRequest) => Promise<void>;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateOnboardingStep: (data: OnboardingStepRequest) => Promise<void>;
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
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusDetails | null>(null);
  const [user, setUser] = useState<ExtendedUserInfo | null>(() => {
    const storedUser = authManager.getStoredUser();
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const router = useRouter();

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
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
    const refreshedTokens = await authManager.refreshTokens();
    if (refreshedTokens) {
      const userData = await userApi.getCurrentUser();
      setUserAndStore(userData);
      setOnboardingStatus(userData.onboardingStatus as OnboardingStatusDetails | null);
    } else {
      setUserAndStore(null);
      setOnboardingStatus(null);
    }
  };

  const logout = async () => {
    setLoading(true);
    await authManager.logout();
    setUserAndStore(null);
    setOnboardingStatus(null);
    router.push('/login');
    setLoading(false);
  };

  const signup = async (data: SignupRequest) => {
    await authorizationApi.signup(data);
    router.push('/login');
  };

  const login = async (loginData: LoginRequest) => {
    const response = await authorizationApi.login(loginData);
    if (response?.user) {
      authManager.setTokens(response.accessToken, response.refreshToken, response.sessionId);
      setUserAndStore(response.user);
      router.push(response.onboardingComplete ? '/moodboard' : '/onboarding');
    }
  };

  const verifyMagicLink = async (token: string): Promise<boolean> => {
    const response = await authManager.verifyMagicLink(token);
    if (response?.user) {
      setUserAndStore(response.user);
      setOnboardingStatus(response.user.onboardingStatus as OnboardingStatusDetails | null);
      return true;
    }
    return false;
  };

  const requestMagicLink = async (email: string) => {
    await authorizationApi.requestMagicLink(email);
  };

  const updateOnboardingStep = async (data: OnboardingStepRequest) => {
    const response = await onboardingApi.updateOnboardingStep(data);
    setUserAndStore(response.user);
    setOnboardingStatus(response.user?.onboardingStatus as OnboardingStatusDetails | null);
  };

  const switchTenant = async (tenantId: string) => {
    const updatedUser = await userApi.switchTenant(tenantId);
    setUserAndStore(updatedUser);
  };

  const joinTenant = async (tenantId: string) => {
    const updatedUser = await userApi.joinTenant(tenantId);
    setUserAndStore(updatedUser);
  };

  const getUserTenants = async () => {
    return userApi.getUserTenants();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      onboardingStatus,
      signup,
      login,
      verifyMagicLink,
      requestMagicLink,
      logout,
      refreshUser,
      updateOnboardingStep,
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