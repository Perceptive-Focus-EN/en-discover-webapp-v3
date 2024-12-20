import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  SettingsState, 
  NotificationSettings, 
  PrivateSettings, 
  StyleSettings, 
  OverseerInviteSettings 
} from '@/types/Settings/interfaces';
import { settingsApi } from '../lib/api/settings/client';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SettingsContextType {
  settings: SettingsState | null;
  isLoading: boolean;
  updateSettings: (category: string, newSettings: Partial<SettingsState>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateTheme: (newTheme: 'light' | 'dark' | 'system') => Promise<void>;
}

interface ExtendedSettingsState extends SettingsState {
  isLoading: boolean;
}

type SettingsAction =
  | { type: 'FETCH_INIT' }
  | { type: 'FETCH_SUCCESS'; payload: SettingsState }
  | { type: 'UPDATE_SUCCESS'; payload: Partial<SettingsState> };

const settingsReducer = (state: ExtendedSettingsState, action: SettingsAction): ExtendedSettingsState => {
  switch (action.type) {
    case 'FETCH_INIT':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return { ...state, ...action.payload, isLoading: false };
    case 'UPDATE_SUCCESS':
      return { ...state, ...action.payload };
    default:
      return state;
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
    tenantInfo: {
      roles: [],
      resourceAllocation: {
        storageLimit: 0,
        apiUsageLimit: 0
      }
    },
    error: null
  };

  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { user } = useAuth();

  const fetchSettings = useCallback(async () => {
    dispatch({ type: 'FETCH_INIT' });
    const storedSettings = localStorage.getItem('userSettings');
    if (storedSettings) {
      dispatch({ type: 'FETCH_SUCCESS', payload: JSON.parse(storedSettings) });
      return;
    }

    try {
      const allSettingsResponse = await settingsApi.getAll();

      if (!allSettingsResponse) {
        throw new Error('Failed to fetch settings');
      }

      const fetchedSettings: ExtendedSettingsState = {
        ...state,
        ...allSettingsResponse,
        isLoading: false,
      };

      dispatch({ type: 'FETCH_SUCCESS', payload: fetchedSettings });
      localStorage.setItem('userSettings', JSON.stringify(fetchedSettings));
    } catch (error) {
      messageHandler.error('Failed to fetch settings');
      dispatch({ type: 'FETCH_SUCCESS', payload: { ...state, isLoading: false } });
    }
  }, [user]);

  
  const updateSettings = async (category: string, newSettings: Partial<SettingsState>) => {
    try {
      switch (category) {
        case 'notifications':
          await settingsApi.notifications.update(newSettings.notifications as NotificationSettings);
          break;
        case 'private':
          await settingsApi.privateSettings.update(newSettings.private as PrivateSettings);
          break;
        case 'style':
          await settingsApi.styleSettings.update(newSettings.style as StyleSettings);
          break;
        case 'overseerInvites':
          if (newSettings.overseerInvites) {
            await settingsApi.overseerInvites.send(newSettings.overseerInvites as OverseerInviteSettings);
          }
          break;
        case 'appRating':
          if (newSettings.appRating) {
            await settingsApi.appRating.submit(newSettings.appRating as unknown as { rating: number; feedback: string });
          }
          break;
        case 'all':
          await settingsApi.updateAll(newSettings);
          break;
        default:
          throw new Error(`Invalid settings category: ${category}`);
      }

      const updatedSettings = { ...state, ...newSettings };
      dispatch({ type: 'UPDATE_SUCCESS', payload: updatedSettings });
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      messageHandler.success('Settings updated successfully');  // Add success feedback
    } catch (error) {
      messageHandler.error(`Failed to update ${category} settings`);  // Use messageHandler for error feedback
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
      messageHandler.success(`Theme updated to ${newTheme}`);  // Add feedback for theme update
    } catch (error) {
      messageHandler.error('Failed to update theme');  // Use messageHandler for error feedback
    }
  };

  const refreshSettings = async () => {
    if (user) {
      await fetchSettings();
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