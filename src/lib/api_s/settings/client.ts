// src/lib/api_s/settings/client.ts
import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { 
  NotificationSettings, 
  PrivateSettings, 
  StyleSettings, 
  OverseerInviteSettings,
  FaqSettings,
  AppRatingSettings,
  TermsSettings,
  PrivacyPolicySettings
} from '@/types/Settings/interfaces';

const BASE_URL = '/api/settings';

interface SettingsResponse<T> {
  data: T;
  success: boolean;
  message: string;
}

interface AllSettingsResponse {
  notifications: NotificationSettings;
  private: PrivateSettings;
  style: StyleSettings;
  overseerInvites: OverseerInviteSettings;
  faq: FaqSettings;
  appRating: AppRatingSettings;
  terms: TermsSettings;
  privacyPolicy: PrivacyPolicySettings;
}

export const settingsApi = {
  notifications: {
    get: async (): Promise<NotificationSettings> => {
      try {
        const response = await api.get<SettingsResponse<NotificationSettings>>(
          `${BASE_URL}/notifications`
        );

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'notifications_fetch',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT
        );

        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch notification settings');
        throw error;
      }
    },

    update: async (data: NotificationSettings): Promise<NotificationSettings> => {
      try {
        const response = await api.put<SettingsResponse<NotificationSettings>>(
          `${BASE_URL}/notifications`,
          data
        );
        
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'notifications_update',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT
        );

        messageHandler.success('Notification settings updated');
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to update notification settings');
        throw error;
      }
    },
  },

  privateSettings: {
    get: async (): Promise<PrivateSettings> => {
      try {
        const response = await api.get<SettingsResponse<PrivateSettings>>(
          `${BASE_URL}/private`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch privacy settings');
        throw error;
      }
    },

    update: async (data: PrivateSettings): Promise<PrivateSettings> => {
      try {
        const response = await api.put<SettingsResponse<PrivateSettings>>(
          `${BASE_URL}/private`,
          data
        );
        messageHandler.success('Privacy settings updated');
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to update privacy settings');
        throw error;
      }
    },
  },

  styleSettings: {
    get: async (): Promise<StyleSettings> => {
      try {
        const response = await api.get<SettingsResponse<StyleSettings>>(
          `${BASE_URL}/style`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch style settings');
        throw error;
      }
    },

    update: async (data: StyleSettings): Promise<StyleSettings> => {
      try {
        const response = await api.put<SettingsResponse<StyleSettings>>(
          `${BASE_URL}/style`,
          data
        );
        messageHandler.success('Style settings updated');
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to update style settings');
        throw error;
      }
    },
  },

  overseerInvites: {
    get: async (): Promise<OverseerInviteSettings> => {
      try {
        const response = await api.get<SettingsResponse<OverseerInviteSettings>>(
          `${BASE_URL}/overseer-invites`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch overseer invite settings');
        throw error;
      }
    },

    send: async (data: OverseerInviteSettings): Promise<OverseerInviteSettings> => {
      try {
        const response = await api.post<SettingsResponse<OverseerInviteSettings>>(
          `${BASE_URL}/overseer-invites`,
          data
        );
        messageHandler.success('Overseer invite sent successfully');
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to send overseer invite');
        throw error;
      }
    },
  },

  faq: {
    get: async (): Promise<FaqSettings> => {
      try {
        const response = await api.get<SettingsResponse<FaqSettings>>(
          `${BASE_URL}/faq`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch FAQ');
        throw error;
      }
    },
  },

  appRating: {
    get: async (): Promise<AppRatingSettings> => {
      try {
        const response = await api.get<SettingsResponse<AppRatingSettings>>(
          `${BASE_URL}/rate-app`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch app rating settings');
        throw error;
      }
    },

    submit: async (data: { rating: number; feedback: string }): Promise<AppRatingSettings> => {
      try {
        const response = await api.post<SettingsResponse<AppRatingSettings>>(
          `${BASE_URL}/rate-app`,
          data
        );
        messageHandler.success('Thank you for your feedback!');
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to submit app rating');
        throw error;
      }
    },
  },

  terms: {
    get: async (): Promise<TermsSettings> => {
      try {
        const response = await api.get<SettingsResponse<TermsSettings>>(
          `${BASE_URL}/terms`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch terms');
        throw error;
      }
    },
  },

  privacyPolicy: {
    get: async (): Promise<PrivacyPolicySettings> => {
      try {
        const response = await api.get<SettingsResponse<PrivacyPolicySettings>>(
          `${BASE_URL}/privacy`
        );
        return response.data;
      } catch (error) {
        messageHandler.error('Failed to fetch privacy policy');
        throw error;
      }
    },
  },

  getAll: async (): Promise<AllSettingsResponse> => {
    try {
      const response = await api.get<SettingsResponse<AllSettingsResponse>>(BASE_URL);
      return response.data;
    } catch (error) {
      messageHandler.error('Failed to fetch settings');
      throw error;
    }
  },

  updateAll: async (data: Partial<AllSettingsResponse>): Promise<AllSettingsResponse> => {
    try {
      const response = await api.put<SettingsResponse<AllSettingsResponse>>(
        BASE_URL,
        data
      );
      messageHandler.success('Settings updated successfully');
      return response.data;
    } catch (error) {
      messageHandler.error('Failed to update settings');
      throw error;
    }
  },
};