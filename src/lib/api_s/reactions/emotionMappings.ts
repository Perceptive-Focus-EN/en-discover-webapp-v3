// src/lib/api_s/reactions/emotionMappings.ts
import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { Emotion } from '../../../components/EN/types/emotions';
import { mockEmotionMappingsApi } from './mockEmotionMappingsApi';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_MAPPING_API === 'true';

const realEmotionMappingsApi = {
  getEmotionMappings: async (userId: string) => {
    const response = await axiosInstance.get(`/api/users/${userId}/emotionMappings`);
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  saveEmotionMappings: async (userId: string, emotions: Emotion[]) => {
    const response = await axiosInstance.put(`/api/users/${userId}/emotionMappings`, { emotions });
    messageHandler.success('Emotion mappings saved successfully');
    return response.data;
  },

  addEmotionMapping: async (userId: string, emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await axiosInstance.post(`/api/users/${userId}/emotionMappings`, { emotion });
    messageHandler.success('Emotion mapping added');
    return response.data;
  },

  updateEmotionMapping: async (userId: string, id: number, update: Partial<Emotion>) => {
    const response = await axiosInstance.patch(`/api/users/${userId}/emotionMappings`, { id, update });
    messageHandler.success('Emotion mapping updated');
    return response.data;
  },

  deleteEmotionMapping: async (userId: string, emotionId: number) => {
    const response = await axiosInstance.delete(`/api/users/${userId}/emotionMappings`, { 
      data: { emotionId } 
    });
    messageHandler.success('Emotion mapping deleted');
    return response.data;
  }
};

export const emotionMappingsApi = USE_MOCK_API ? mockEmotionMappingsApi : realEmotionMappingsApi;