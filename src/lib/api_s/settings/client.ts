// src/lib/api_s/settings/client.ts

import axiosInstance from '../../axiosSetup';
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

export const settingsApi = {
  notifications: {
    get: () => axiosInstance.get<NotificationSettings>(`${BASE_URL}/notifications`),
    update: (data: NotificationSettings) => axiosInstance.put(`${BASE_URL}/notifications`, data),
  },
  privateSettings: {
    get: () => axiosInstance.get<PrivateSettings>(`${BASE_URL}/private`),
    update: (data: PrivateSettings) => axiosInstance.put(`${BASE_URL}/private`, data),
  },
  styleSettings: {
    get: () => axiosInstance.get<StyleSettings>(`${BASE_URL}/style`),
    update: (data: StyleSettings) => axiosInstance.put(`${BASE_URL}/style`, data),
  },
  overseerInvites: {
    get: () => axiosInstance.get<OverseerInviteSettings>(`${BASE_URL}/overseer-invites`),
    send: (data: OverseerInviteSettings) => axiosInstance.post(`${BASE_URL}/overseer-invites`, data),
  },
  faq: {
    get: () => axiosInstance.get<FaqSettings>(`${BASE_URL}/faq`),
  },
  appRating: {
    get: () => axiosInstance.get<AppRatingSettings>(`${BASE_URL}/rate-app`),
    submit: (data: { rating: number; feedback: string }) => axiosInstance.post(`${BASE_URL}/rate-app`, data),
  },
  terms: {
    get: () => axiosInstance.get<TermsSettings>(`${BASE_URL}/terms`),
  },
  privacyPolicy: {
    get: () => axiosInstance.get<PrivacyPolicySettings>(`${BASE_URL}/privacy`),
  },
  // General settings operations
  getAll: () => axiosInstance.get<any>(`${BASE_URL}`),
  updateAll: (data: any) => axiosInstance.put(`${BASE_URL}`, data),
};

export default settingsApi;