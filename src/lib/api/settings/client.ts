// File: src/lib/api_s/settings/client.ts

import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { isApiError, extractErrorMessage } from '@/lib/api/client/utils';
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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

const handleSettingsError = (error: any, operation: string) => {
  monitoringManager.metrics.recordMetric(
    MetricCategory.BUSINESS,
    'settings_error',
    operation,
    1,
    MetricType.COUNTER,
    MetricUnit.COUNT,
    {
      errorType: isApiError(error) ? error.response?.data?.error?.type : 'unknown',
      statusCode: error.response?.status
    }
  );
  const errorMessage = extractErrorMessage(error);
  messageHandler.error(errorMessage || `Failed to ${operation}`);
  throw error;
};

export const settingsApi = {

  getAll: async (): Promise<AllSettingsResponse | undefined> => {
  try {
    const startTime = Date.now();
    // Change the access pattern - response is already unwrapped by api utility
    const response = await api.get<ApiResponse<AllSettingsResponse>>(`${BASE_URL}/all/get`);

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'settings',
      'get_all',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS
    );

    // Just checking the response directly 
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch settings');
    }

    return response.data;
  } catch (error) {
    handleSettingsError(error, 'fetch all settings');
    return undefined;
  }
},

updateAll: async (data: Partial<AllSettingsResponse>): Promise<AllSettingsResponse | undefined> => {
  try {
    const startTime = Date.now();
    // Change the access pattern here too
    const response = await api.put<ApiResponse<AllSettingsResponse>>(
      `${BASE_URL}/all`,
      data
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'settings',
      'update_all',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update settings');
    }

    messageHandler.success('Settings updated successfully');
    return response.data;
  } catch (error) {
    handleSettingsError(error, 'update all settings');
    return undefined;
  }
  },

  notifications: {
    get: async (): Promise<NotificationSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<NotificationSettings>>(`${BASE_URL}/notifications/get`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'notifications_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch notification settings');
        return undefined;
      }
    },

    update: async (data: NotificationSettings): Promise<NotificationSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.put<ApiResponse<NotificationSettings>>(
          `${BASE_URL}/notifications/update`,
          data
        );

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'notifications_update',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        messageHandler.success('Notification settings updated');
        return response.data;
      } catch (error) {
        handleSettingsError(error, 'update notification settings');
        return undefined;
      }
    },
  },

  privateSettings: {
    get: async (): Promise<PrivateSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<PrivateSettings>>(`${BASE_URL}/private`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'private_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch privacy settings');
        return undefined;
      }
    },

    update: async (data: PrivateSettings): Promise<PrivateSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.put<ApiResponse<PrivateSettings>>(`${BASE_URL}/private`, data);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'private_update',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        messageHandler.success('Privacy settings updated');
        return response.data;
      } catch (error) {
        handleSettingsError(error, 'update privacy settings');
        return undefined;
      }
    },
  },

  styleSettings: {
    get: async (): Promise<StyleSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<StyleSettings>>(`${BASE_URL}/style`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'style_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch style settings');
        return undefined;
      }
    },

    update: async (data: StyleSettings): Promise<StyleSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.put<ApiResponse<StyleSettings>>(`${BASE_URL}/style`, data);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'style_update',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        messageHandler.success('Style settings updated');
        return response.data;
      } catch (error) {
        handleSettingsError(error, 'update style settings');
        return undefined;
      }
    },
  },

  overseerInvites: {
    get: async (): Promise<OverseerInviteSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<OverseerInviteSettings>>(`${BASE_URL}/overseer-invites`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'overseer_invites_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch overseer invite settings');
        return undefined;
      }
    },

    send: async (data: OverseerInviteSettings): Promise<OverseerInviteSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.post<ApiResponse<OverseerInviteSettings>>(
          `${BASE_URL}/overseer-invites`,
          data
        );

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'overseer_invites_send',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        messageHandler.success('Overseer invite sent successfully');
        return response.data;
      } catch (error) {
        handleSettingsError(error, 'send overseer invite');
        return undefined;
      }
    },
  },

  faq: {
    get: async (): Promise<FaqSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<FaqSettings>>(`${BASE_URL}/faq`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'faq_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch FAQ');
        return undefined;
      }
    },
  },

  appRating: {
    get: async (): Promise<AppRatingSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<AppRatingSettings>>(`${BASE_URL}/app-rating`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'app_rating_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch app rating settings');
        return undefined;
      }
    },

    submit: async (data: { rating: number; feedback: string }): Promise<AppRatingSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.post<ApiResponse<AppRatingSettings>>(`${BASE_URL}/app-rating`, data);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'app_rating_submit',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        messageHandler.success('Thank you for your feedback!');
        return response.data;
      } catch (error) {
        handleSettingsError(error, 'submit app rating');
        return undefined;
      }
    },
  },

  terms: {
    get: async (): Promise<TermsSettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<TermsSettings>>(`${BASE_URL}/terms`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'terms_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch terms');
        return undefined;
      }
    },
  },

  privacyPolicy: {
    get: async (): Promise<PrivacyPolicySettings | undefined> => {
      try {
        const startTime = Date.now();
        const response = await api.get<ApiResponse<PrivacyPolicySettings>>(`${BASE_URL}/privacy-policy`);

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'settings',
          'privacy_policy_fetch',
          Date.now() - startTime,
          MetricType.HISTOGRAM,
          MetricUnit.MILLISECONDS
        );

        return response.data;
      } catch (error) {
        handleSettingsError(error, 'fetch privacy policy');
        return undefined;
      }
    },
  },
};
