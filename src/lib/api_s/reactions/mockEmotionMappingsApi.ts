// src/lib/api_s/reactions/mockEmotionMappingsApi.ts

import { Emotion } from '../../../components/EN/types/emotions';

const API_URL = '/api/mocks/db/mockEmotionColorMappings';

export const mockEmotionMappingsApi = {
  // Get emotion mappings for a user
  getEmotionMappings: async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}?userId=${userId}`);
      const data = await response.json();
      console.log('Mock API response:', data);
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      console.error('Error in getEmotionMappings:', error);
      throw error;
    }
  },

  // Create or update all emotion mappings for a user
  saveEmotionMappings: async (userId: string, emotions: Emotion[]) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emotions }),
      });
      return response.json();
    } catch (error) {
      console.error('Error in saveEmotionMappings:', error);
      throw error;
    }
  },

  // Add a new emotion mapping
  addEmotionMapping: async (userId: string, emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, emotion }),
      });
      return response.json();
    } catch (error) {
      console.error('Error in addEmotionMapping:', error);
      throw error;
    }
  },

  // Update a single emotion mapping
  updateEmotionMapping: async (userId: string, id: number, update: Partial<Emotion>) => {
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, update }),
      });
      return response.json();
    } catch (error) {
      console.error('Error in updateEmotionMapping:', error);
      throw error;
    }
  },

  // Delete an emotion mapping
  deleteEmotionMapping: async (userId: string, emotionId: number) => {
    try {
      const response = await fetch(`${API_URL}?id=${emotionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      return response.json();
    } catch (error) {
      console.error('Error in deleteEmotionMapping:', error);
      throw error;
    }
  },

  // Simulate emotions over time
  simulateEmotionsOverTime: async (userId: string, startDate: Date, endDate: Date) => {
    try {
      const response = await fetch(`${API_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, startDate, endDate }),
      });
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in simulateEmotionsOverTime:', error);
      throw error;
    }
  }
};