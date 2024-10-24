// src/lib/api_s/reactions/mockEmotionMappingsApi.ts
import { Emotion } from '../../../components/EN/types/emotions';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

const API_URL = '/api/mocks/db/mockEmotionColorMappings';

export const mockEmotionMappingsApi = {
  // GET operations - no success messages
  getEmotionMappings: async (userId: string) => {
    const response = await fetch(`${API_URL}?userId=${userId}`);
    if (!response.ok) {
      messageHandler.error('Failed to fetch emotion mappings');
      throw new Error('Failed to fetch emotion mappings');
    }
    const data = await response.json();
    return Array.isArray(data.data) ? data.data : [];
  },

  // Mutation operations - include success messages
  saveEmotionMappings: async (userId: string, emotions: Emotion[]) => {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emotions }),
    });
    
    if (!response.ok) {
      messageHandler.error('Failed to save emotion mappings');
      throw new Error('Failed to save emotion mappings');
    }
    
    messageHandler.success('Emotion mappings saved successfully');
    return response.json();
  },

  addEmotionMapping: async (
    userId: string, 
    emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emotion }),
    });

    if (!response.ok) {
      messageHandler.error('Failed to add emotion mapping');
      throw new Error('Failed to add emotion mapping');
    }

    messageHandler.success('Emotion mapping added successfully');
    return response.json();
  },

  updateEmotionMapping: async (userId: string, id: number, update: Partial<Emotion>) => {
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, update }),
    });

    if (!response.ok) {
      messageHandler.error('Failed to update emotion mapping');
      throw new Error('Failed to update emotion mapping');
    }

    messageHandler.success('Emotion mapping updated successfully');
    return response.json();
  },

  deleteEmotionMapping: async (userId: string, emotionId: number) => {
    const response = await fetch(`${API_URL}?id=${emotionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      messageHandler.error('Failed to delete emotion mapping');
      throw new Error('Failed to delete emotion mapping');
    }

    messageHandler.success('Emotion mapping deleted successfully');
    return response.json();
  },

  simulateEmotionsOverTime: async (userId: string, startDate: Date, endDate: Date) => {
    messageHandler.info('Simulating emotions...');
    
    const response = await fetch(`${API_URL}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, startDate, endDate }),
    });

    if (!response.ok) {
      messageHandler.error('Failed to simulate emotions');
      throw new Error('Failed to simulate emotions');
    }

    messageHandler.success('Emotion simulation completed');
    const data = await response.json();
    return data.data;
  }
};

// Usage example:
/*
try {
  // GET operation - no success message
  const mappings = await mockEmotionMappingsApi.getEmotionMappings('user123');

  // Mutation operations - success messages handled by API
  await mockEmotionMappingsApi.saveEmotionMappings('user123', emotions);
  await mockEmotionMappingsApi.addEmotionMapping('user123', newEmotion);
  await mockEmotionMappingsApi.updateEmotionMapping('user123', 1, update);
  await mockEmotionMappingsApi.deleteEmotionMapping('user123', 1);
  
  // Long operation - info and success messages
  await mockEmotionMappingsApi.simulateEmotionsOverTime('user123', startDate, endDate);
} catch (error) {
  // Errors handled with messageHandler in the API
  // Just handle UI updates if needed
}
*/