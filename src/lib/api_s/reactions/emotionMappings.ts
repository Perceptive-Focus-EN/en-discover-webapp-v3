// src/lib/api_s/reactions/emotionMappings.ts
import axiosInstance from '../../axiosSetup';
import { Emotion } from '../../../components/EN/types/emotions';
import { mockEmotionMappingsApi } from './mockEmotionMappingsApi';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_MAPPING_API === 'true';

const realEmotionMappingsApi = {
  // Get emotion mappings for a user
  getEmotionMappings: async (userId: string) => {
    try {
      const response = await axiosInstance.get(`/api/users/${userId}/emotionMappings`);
      console.log('API response:', response.data);
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Error in getEmotionMappings:', error);
      throw error;
    }
  },

  // Create or update all emotion mappings for a user
  saveEmotionMappings: async (userId: string, emotions: Emotion[]) => {
    try {
      const response = await axiosInstance.put(`/api/users/${userId}/emotionMappings`, { emotions });
      return response.data;
    } catch (error) {
      console.error('Error in saveEmotionMappings:', error);
      throw error;
    }
  },

  // Add a new emotion mapping
  addEmotionMapping: async (userId: string, emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await axiosInstance.post(`/api/users/${userId}/emotionMappings`, { emotion });
      return response.data;
    } catch (error) {
      console.error('Error in addEmotionMapping:', error);
      throw error;
    }
  },

  // Update a single emotion mapping
  updateEmotionMapping: async (userId: string, id: number, update: Partial<Emotion>) => {
    try {
      const response = await axiosInstance.patch(`/api/users/${userId}/emotionMappings`, { id, update });
      return response.data;
    } catch (error) {
      console.error('Error in updateEmotionMapping:', error);
      throw error;
    }
  },

  // Delete an emotion mapping
  deleteEmotionMapping: async (userId: string, emotionId: number) => {
    try {
      const response = await axiosInstance.delete(`/api/users/${userId}/emotionMappings`, { 
        data: { emotionId } 
      });
      return response.data;
    } catch (error) {
      console.error('Error in deleteEmotionMapping:', error);
      throw error;
    }
  }
};

export const emotionMappingsApi = USE_MOCK_API ? mockEmotionMappingsApi : realEmotionMappingsApi;