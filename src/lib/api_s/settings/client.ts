// src/lib/api_s/settings/client.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
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
    get: async () => {
      const response = await axiosInstance.get<NotificationSettings>(`${BASE_URL}/notifications`);
      return response.data;
    },
    update: async (data: NotificationSettings) => {
      const response = await axiosInstance.put(`${BASE_URL}/notifications`, data);
      messageHandler.success('Notification settings updated');
      return response.data;
    },
  },
  privateSettings: {
    get: async () => {
      const response = await axiosInstance.get<PrivateSettings>(`${BASE_URL}/private`);
      return response.data;
    },
    update: async (data: PrivateSettings) => {
      const response = await axiosInstance.put(`${BASE_URL}/private`, data);
      messageHandler.success('Privacy settings updated');
      return response.data;
    },
  },
  styleSettings: {
    get: async () => {
      const response = await axiosInstance.get<StyleSettings>(`${BASE_URL}/style`);
      return response.data;
    },
    update: async (data: StyleSettings) => {
      const response = await axiosInstance.put(`${BASE_URL}/style`, data);
      messageHandler.success('Style settings updated');
      return response.data;
    },
  },
  overseerInvites: {
    get: async () => {
      const response = await axiosInstance.get<OverseerInviteSettings>(`${BASE_URL}/overseer-invites`);
      return response.data;
    },
    send: async (data: OverseerInviteSettings) => {
      const response = await axiosInstance.post(`${BASE_URL}/overseer-invites`, data);
      messageHandler.success('Overseer invite sent successfully');
      return response.data;
    },
  },
  faq: {
    get: async () => {
      const response = await axiosInstance.get<FaqSettings>(`${BASE_URL}/faq`);
      return response.data;
    },
  },
  appRating: {
    get: async () => {
      const response = await axiosInstance.get<AppRatingSettings>(`${BASE_URL}/rate-app`);
      return response.data;
    },
    submit: async (data: { rating: number; feedback: string }) => {
      const response = await axiosInstance.post(`${BASE_URL}/rate-app`, data);
      messageHandler.success('Thank you for your feedback!');
      return response.data;
    },
  },
  terms: {
    get: async () => {
      const response = await axiosInstance.get<TermsSettings>(`${BASE_URL}/terms`);
      return response.data;
    },
  },
  privacyPolicy: {
    get: async () => {
      const response = await axiosInstance.get<PrivacyPolicySettings>(`${BASE_URL}/privacy`);
      return response.data;
    },
  },
  getAll: async () => {
    const response = await axiosInstance.get<any>(`${BASE_URL}`);
    return response.data;
  },
  updateAll: async (data: any) => {
    const response = await axiosInstance.put(`${BASE_URL}`, data);
    messageHandler.success('Settings updated successfully');
    return response.data;
  },
};