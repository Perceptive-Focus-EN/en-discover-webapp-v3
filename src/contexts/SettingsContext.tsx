// src/contexts/SettingsContext.tsx

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { frontendLogger } from '../utils/ErrorHandling/frontendLogger';
import { SettingsState, NotificationSettings, PrivateSettings, StyleSettings, OverseerInviteSettings } from '@/types/Settings/interfaces';
import settingsApi from '../lib/api_s/settings/client';

interface SettingsContextType {
  settings: SettingsState | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (category: string, newSettings: Partial<SettingsState>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateTheme: (newTheme: 'light' | 'dark' | 'system') => Promise<void>;
}

interface ExtendedSettingsState extends SettingsState {
  isLoading: boolean;
  error: string | null;
}

type SettingsAction =
  | { type: 'FETCH_INIT' }
  | { type: 'FETCH_SUCCESS'; payload: SettingsState }
  | { type: 'FETCH_FAILURE'; error: string }
  | { type: 'UPDATE_SUCCESS'; payload: Partial<SettingsState> }
  | { type: 'UPDATE_FAILURE'; error: string };

const settingsReducer = (state: ExtendedSettingsState, action: SettingsAction): ExtendedSettingsState => {
  switch (action.type) {
    case 'FETCH_INIT':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      const { isLoading, ...payloadWithoutIsLoading } = action.payload;
      return { ...state, isLoading: false, ...payloadWithoutIsLoading, error: null };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false, error: action.error };
    case 'UPDATE_SUCCESS':
      return { ...state, ...action.payload, error: null };
    case 'UPDATE_FAILURE':
      return { ...state, error: action.error };
    default:
      throw new Error(`Unhandled action type: ${(action as any).type}`);
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState: ExtendedSettingsState = {
    id: '',
    userId: '',
    tenantId: '',
    avatarUrl: '',
    notifications: {
      email: false,
      sms: false,
      inApp: false
    },
    private: {
      security: {
        twoFactorAuthEnabled: false,
        passwordLastChanged: new Date(),
        activeSessions: []
      },
      privacy: {
        dataSharing: false,
        activityTracking: false,
        visibility: {
          profile: 'private',
          email: 'private',
          phone: 'private',
          location: 'private',
          age: 'private',
          dob: 'private'
        }
      }
    },
    style: {
      theme: 'dark',
      language: '',
      font: '',
      fontSize: 0,
      colorScheme: ''
    },
    overseerInvites: {
      pendingInvites: [],
      inviteHistory: []
    },
    faq: { questions: [], lastUpdated: new Date() },
    appRating: { currentRating: 0, feedbackHistory: [] },
    terms: { version: '', lastAccepted: new Date(), content: '' },
    privacyPolicy: { version: '', lastAccepted: new Date(), content: '' },
    apiAccess: { apiKeys: [], permissions: [] },
    isLoading: true,
    error: null,
    tenantInfo: {
      roles: [],
      resourceAllocation: {
        storageLimit: 0,
        apiUsageLimit: 0
      }
    }
  };

  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      frontendLogger.setUser(user.userId);
    }
    frontendLogger.setContext({ component: 'SettingsProvider' });
    return () => {
      frontendLogger.clearContext();
    };
  }, [user]);

  const fetchSettings = useCallback(async () => {
    dispatch({ type: 'FETCH_INIT' });
    frontendLogger.setContext({ action: 'fetchSettings' });
    try {
      const storedSettings = localStorage.getItem('userSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        dispatch({ type: 'FETCH_SUCCESS', payload: parsedSettings });
        frontendLogger.info('Settings loaded from localStorage', 'Settings have been successfully loaded from local storage');
      } else {
        const startTime = performance.now();
        const [
          allSettingsResponse,
          faqResponse,
          termsResponse,
          privacyPolicyResponse
        ] = await Promise.all([
          settingsApi.getAll(),
          settingsApi.faq.get(),
          settingsApi.terms.get(),
          settingsApi.privacyPolicy.get()
        ]);

        const fetchedSettings: ExtendedSettingsState = {
          ...allSettingsResponse.data,
          faq: faqResponse.data,
          terms: termsResponse.data,
          privacyPolicy: privacyPolicyResponse.data,
          isLoading: false,
          error: null
        };

        const endTime = performance.now();
        frontendLogger.logPerformance('settings_fetch_duration', endTime - startTime);
        dispatch({ type: 'FETCH_SUCCESS', payload: fetchedSettings });
        localStorage.setItem('userSettings', JSON.stringify(fetchedSettings));
        frontendLogger.info('Settings fetched from API', 'Settings have been successfully fetched from the API');
      }
    } catch (err) {
      dispatch({ type: 'FETCH_FAILURE', error: 'Failed to fetch settings' });
      frontendLogger.error('Failed to fetch settings', JSON.stringify(err as unknown as Record<string, unknown>));
    } finally {
      frontendLogger.clearContext();
    }
  }, [user]);

  const updateSettings = async (category: string, newSettings: Partial<SettingsState>) => {
    frontendLogger.setContext({ action: 'updateSettings' });
    try {
      const startTime = performance.now();

      let updatePromise;
      switch (category) {
        case 'notifications':
          updatePromise = settingsApi.notifications.update(newSettings.notifications as NotificationSettings);
          break;
        case 'private':
          updatePromise = settingsApi.privateSettings.update(newSettings.private as PrivateSettings);
          break;
        case 'style':
          updatePromise = settingsApi.styleSettings.update(newSettings.style as StyleSettings);
          break;
        case 'overseerInvites':
          updatePromise = settingsApi.overseerInvites.send(newSettings.overseerInvites as OverseerInviteSettings);
          break;
        case 'appRating':
          if (newSettings.appRating) {
            updatePromise = settingsApi.appRating.submit(newSettings.appRating as unknown as { rating: number; feedback: string });
          } else {
            throw new Error('appRating is missing in newSettings');
          }
          break;
        default:
          throw new Error(`Invalid settings category: ${category}`);
      }

      await updatePromise;

      const updatedSettings = { ...state, ...newSettings };
      const endTime = performance.now();
      frontendLogger.logPerformance('settings_update_duration', endTime - startTime);
      dispatch({ type: 'UPDATE_SUCCESS', payload: updatedSettings });
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      frontendLogger.info('Settings updated successfully', `Updated category: ${category}`);
    } catch (err) {
      dispatch({ type: 'UPDATE_FAILURE', error: 'Failed to update settings' });
      frontendLogger.error('Failed to update settings', JSON.stringify(err as Record<string, unknown>));
      throw err;
    } finally {
      frontendLogger.clearContext();
    }
  };

  const updateTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await updateSettings('style', { style: { ...state.style, theme: newTheme } });
      if (newTheme !== 'system') {
        localStorage.setItem('themeMode', newTheme);
      } else {
        localStorage.removeItem('themeMode');
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const refreshSettings = async () => {
    frontendLogger.setContext({ action: 'refreshSettings' });
    if (!user) {
      dispatch({ type: 'FETCH_FAILURE', error: 'User is not authenticated' });
      frontendLogger.warn('Attempted to refresh settings without user', 'User is not authenticated');
      return;
    }
    try {
      dispatch({ type: 'FETCH_INIT' });
      await fetchSettings();
      frontendLogger.info('Settings refreshed from API', 'Settings have been successfully refreshed from the API');
    } catch (err) {
      dispatch({ type: 'FETCH_FAILURE', error: 'Failed to refresh settings' });
      frontendLogger.error('Failed to refresh settings', JSON.stringify(err as Record<string, unknown>));
    } finally {
      frontendLogger.clearContext();
    }
  };

  useEffect(() => {
    if (user && state.isLoading) {
      fetchSettings();
    }
  }, [user, state.isLoading, fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{ 
        settings: state, 
        isLoading: state.isLoading, 
        error: state.error, 
        updateSettings,
        updateTheme,
        refreshSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};