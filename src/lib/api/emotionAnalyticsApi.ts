// src/lib/api_s/emotionAnalyticsApi.ts
import axiosInstance from '../axiosSetup';
import { 
  EmotionAnalytics, 
  MoodEntry, 
  EmotionFrequency, 
  EmotionIntensity, 
  EmotionTrigger, 
  EmotionTrend 
} from '../../components/EN/types/emotionAnalytics';

/**
 * The `emotionAnalyticsApi` object provides methods to interact with the emotion analytics API.
 * All endpoints are GET requests, indicating read-only operations.
 */
export const emotionAnalyticsApi = {
  /**
   * Fetches emotion analytics data for a given tenant.
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to the emotion analytics data.
   */
  fetchEmotionAnalytics: async (tenantId: string): Promise<EmotionAnalytics> => {
    const response = await axiosInstance.get<EmotionAnalytics>(`/emotion-analytics/${tenantId}`);
    return response.data;
  },

  /**
   * Fetches recent mood entries within a specified date range for a given tenant.
   * @param tenantId - The ID of the tenant.
   * @param startDate - The start date of the range (inclusive).
   * @param endDate - The end date of the range (inclusive).
   * @param limit - The maximum number of entries to fetch.
   * @returns A promise that resolves to an array of mood entries.
   */
  fetchRecentEntries: async (
    tenantId: string, 
    startDate: string, 
    endDate: string, 
    limit: number
  ): Promise<MoodEntry[]> => {
    const response = await axiosInstance.get<MoodEntry[]>(`/emotion-analytics/${tenantId}/entries`, {
      params: {
        startDate,
        endDate,
        limit
      }
    });
    return response.data;
  },

  /**
   * Fetches the frequency of different emotions within a specified date range for a given tenant.
   * @param tenantId - The ID of the tenant.
   * @param startDate - The start date of the range (inclusive).
   * @param endDate - The end date of the range (inclusive).
   * @returns A promise that resolves to an array of emotion frequencies.
   */
  fetchEmotionFrequency: async (
    tenantId: string, 
    startDate: string, 
    endDate: string
  ): Promise<EmotionFrequency[]> => {
    const response = await axiosInstance.get<EmotionFrequency[]>(`/emotion-analytics/${tenantId}/frequency`, {
      params: {
        startDate,
        endDate
      }
    });
    return response.data;
  },

  /**
   * Fetches the average intensity of emotions for a given tenant.
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to an array of emotion intensities.
   */
  fetchAverageEmotionIntensity: async (tenantId: string): Promise<EmotionIntensity[]> => {
    const response = await axiosInstance.get<EmotionIntensity[]>(`/emotion-analytics/${tenantId}/intensity`);
    return response.data;
  },

  /**
   * Fetches the triggers of emotions for a given tenant.
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to an array of emotion triggers.
   */
  fetchEmotionTriggers: async (tenantId: string): Promise<EmotionTrigger[]> => {
    const response = await axiosInstance.get<EmotionTrigger[]>(`/emotion-analytics/${tenantId}/triggers`);
    return response.data;
  },

  /**
   * Fetches the trends of emotions for a given tenant.
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to an array of emotion trends.
   */
  fetchEmotionTrends: async (tenantId: string): Promise<EmotionTrend[]> => {
    const response = await axiosInstance.get<EmotionTrend[]>(`/emotion-analytics/${tenantId}/trends`);
    return response.data;
  }
};