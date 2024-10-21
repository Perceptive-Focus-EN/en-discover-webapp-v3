// src/lib/api_s/emotionAnalyticsApi.ts

import axiosInstance from '../axiosSetup';
import { EmotionAnalytics, MoodEntry, EmotionFrequency, EmotionIntensity, EmotionTrigger, EmotionTrend } from '../../components/EN/types/emotionAnalytics';

export const fetchEmotionAnalytics = async (tenantId: string): Promise<EmotionAnalytics> => {
  try {
    const response = await axiosInstance.get<EmotionAnalytics>('/api/emotion-analytics', {
      params: { tenantId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching emotion analytics:', error);
    throw new Error('Failed to fetch emotion analytics');
  }
};


export const fetchRecentEntries = async (tenantId: string, startDate: string, endDate: string, limit: number) => {
  try {
    const response = await fetch(`/api/emotion-analytics/recent-entries?tenantId=${tenantId}&startDate=${startDate}&endDate=${endDate}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent entries');
    return response.json();
  } catch (error) {
    console.error('Error fetching recent mood entries:', error);
    throw new Error('Failed to fetch recent mood entries');
  }
};

export const fetchEmotionFrequency = async (tenantId: string, startDate: string, endDate: string): Promise<EmotionFrequency[]> => {
  try {
    const response = await axiosInstance.get<EmotionFrequency[]>('/api/emotion-analytics/frequency', {
      params: { tenantId, startDate, endDate }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching emotion frequency:', error);
    throw new Error('Failed to fetch emotion frequency');
  }
};

export const fetchAverageEmotionIntensity = async (tenantId: string): Promise<EmotionIntensity[]> => {
  try {
    const response = await axiosInstance.get<EmotionIntensity[]>('/api/emotion-analytics/average-intensity', {
      params: { tenantId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching average emotion intensity:', error);
    throw new Error('Failed to fetch average emotion intensity');
  }
};

export const fetchEmotionTriggers = async (tenantId: string): Promise<EmotionTrigger[]> => {
  try {
    const response = await axiosInstance.get<EmotionTrigger[]>('/api/emotion-analytics/triggers', {
      params: { tenantId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching emotion triggers:', error);
    throw new Error('Failed to fetch emotion triggers');
  }
};

export const fetchEmotionTrends = async (tenantId: string): Promise<EmotionTrend[]> => {
  try {
    const response = await axiosInstance.get<EmotionTrend[]>('/api/emotion-analytics/trends', {
      params: { tenantId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching emotion trends:', error);
    throw new Error('Failed to fetch emotion trends');
  }
};