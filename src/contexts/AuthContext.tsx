// src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authorizationApi } from '../lib/api/authorization';
import { onboardingApi } from '../lib/api/onboarding';
import { userApi } from '../lib/api/user';
import { LoginRequest } from '../types/Login/interfaces';
import { SignupRequest } from '../types/Signup/interfaces';
import { ExtendedUserInfo } from '../types/User/interfaces';
import { OnboardingStepRequest, OnboardingStatusDetails } from '../types/Onboarding/interfaces';
// src/contexts/AuthContext.tsx
import authManager from '../utils/TokenManagement/authManager';  // Change from * import
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { Tenant } from '@/types/Tenant/interfaces';

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
  getUserTenants: () => Promise<Tenant[]>;
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
    setLoading(true);
    try {
      const refreshedTokens = await authManager.refreshTokens();
      if (refreshedTokens) {
        const userData = await userApi.getCurrentUser();
        setUserAndStore(userData);
        setOnboardingStatus(userData.onboardingStatus as OnboardingStatusDetails | null);
      } else {
        setUserAndStore(null);
        setOnboardingStatus(null);
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUserAndStore(null);
      setOnboardingStatus(null);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
  setLoading(true);
  try {
    // Clear auth state first
    setUserAndStore(null);
    setOnboardingStatus(null);

    // Then attempt API logout
    await authManager.logout();
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    setLoading(false);
    // Don't redirect here - let the component handle it
  }
  };

  const signup = async (data: SignupRequest) => {
    try {
      await authorizationApi.signup(data);
      router.push('/login');
    } catch (error) {
      console.error('Signup failed:', error);
      throw error; // Re-throw the error to handle it in the UI
    }
  };

  const login = async (loginData: LoginRequest) => {
    try {
      const response = await authorizationApi.login(loginData);
      if (response?.user) {
        authManager.setTokens(response.session.accessToken, response.session.refreshToken, response.session.sessionId);
        setUserAndStore({ ...response.user, password: '' });
        router.push(response.onboardingComplete ? '/moodboard' : '/onboarding');
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw the error to handle it in the UI
    }
  };
  

  const verifyMagicLink = async (token: string): Promise<boolean> => {
    try {
      const response = await authManager.verifyMagicLink(token);
      if (response?.user) {
        setUserAndStore({ ...response.user, password: '' });
        setOnboardingStatus(response.user.onboardingStatus as OnboardingStatusDetails | null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Magic link verification failed:', error);
      return false;
    }
  };

  const requestMagicLink = async (email: string) => {
    try {
      await authorizationApi.requestMagicLink(email);
    } catch (error) {
      console.error('Magic link request failed:', error);
      throw error;
    }
  };

  const updateOnboardingStep = async (data: OnboardingStepRequest) => {
    try {
      const response = await onboardingApi.updateOnboardingStep(data) as unknown as { user: ExtendedUserInfo };
      if (response.user) {
        setUserAndStore(response.user);
        setOnboardingStatus(response.user.onboardingStatus as OnboardingStatusDetails | null);
      } else {
        console.error('Response does not contain user data');
      }
    } catch (error) {
      console.error('Failed to update onboarding step:', error);
      throw error;
    }
  };

    const switchTenant = async (tenantId: string) => {
  try {
    // Call the API to switch tenants
    await userApi.switchTenant(tenantId);

    // Fetch the updated user data to ensure the UI reflects the new tenant context
    const updatedUser = await userApi.getCurrentUser();
    setUserAndStore(updatedUser); // Update state and local storage
  } catch (error) {
    console.error('Failed to switch tenant:', error);
    throw error; // Propagate the error for handling in the UI if needed
  }
};

    const joinTenant = async (tenantId: string) => {
      try {
        const response = await userApi.joinTenantWithInvite({
          tenantId,
          inviteCode: '',
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          tenantName: '',
          accountType: UserAccountTypeEnum.MEMBER,
        });
        const updatedUser = response.user as ExtendedUserInfo;
        setUserAndStore(updatedUser);
      } catch (error) {
        console.error('Failed to join tenant:', error);
        throw error;
      }
    };


  const getUserTenants = async (): Promise<Tenant[]> => {
  try {
    const tenants = await userApi.getUserTenants();
    // Already returns Tenant[] from the API
    return tenants;
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
};

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
