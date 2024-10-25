// src/lib/api_s/reactions/emotionMappings.ts
import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { Emotion } from '../../../components/EN/types/emotions';
import { mockEmotionMappingsApi } from './mockEmotionMappingsApi';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_MAPPING_API === 'true';

interface EmotionMappingResponse {
  data: Emotion[];
  success: boolean;
  message: string;
}

interface EmotionMappingUpdateResponse {
  emotion: Emotion;
  success: boolean;
  message: string;
}

// src/lib/api_s/reactions/emotionMappings.ts
const realEmotionMappingsApi = {
  getEmotionMappings: async (userId?: string): Promise<Emotion[]> => {
    try {
      if (!userId) {
        throw monitoringManager.error.createError(
          'business',
          'INVALID_REQUEST',
          'User ID is required',
          { userId }
        );
      }

      const response = await api.get<EmotionMappingResponse>(
        `/api/users/${userId}/emotionMappings`
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'emotion_mapping',
        'fetch_count',
        response.data.length,
        MetricType.GAUGE,
        MetricUnit.COUNT,
        { userId }
      );

      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      messageHandler.error('Failed to fetch emotion mappings');
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'emotion_mapping',
        'fetch_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { userId: userId || 'undefined' }
      );

      throw error;
    }
  },
  saveEmotionMappings: async (userId: string, emotions: Emotion[]): Promise<EmotionMappingResponse> => {
    try {
      const response = await api.put<EmotionMappingResponse>(
        `/api/users/${userId}/emotionMappings`,
        { emotions }
      );
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'emotion_mapping',
        'save_batch',
        emotions.length,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { userId }
      );

      messageHandler.success('Emotion mappings saved successfully');
      return response;
    } catch (error) {
      messageHandler.error('Failed to save emotion mappings');
      throw error;
    }
  },

  addEmotionMapping: async (
    userId: string,
    emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<EmotionMappingUpdateResponse> => {
    try {
      const response = await api.post<EmotionMappingUpdateResponse>(
        `/api/users/${userId}/emotionMappings`,
        { emotion }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'emotion_mapping',
        'created',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { userId, emotionName: emotion.emotionName }
      );

      messageHandler.success('Emotion mapping added');
      return response;
    } catch (error) {
      messageHandler.error('Failed to add emotion mapping');
      throw error;
    }
  },

  updateEmotionMapping: async (
    userId: string,
    id: number,
    update: Partial<Emotion>
  ): Promise<EmotionMappingUpdateResponse> => {
    try {
      const response = await api.put<EmotionMappingUpdateResponse>(
        `/api/users/${userId}/emotionMappings`,
        { id, update }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'emotion_mapping',
        'updated',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { userId, emotionId: id }
      );

      messageHandler.success('Emotion mapping updated');
      return response;
    } catch (error) {
      messageHandler.error('Failed to update emotion mapping');
      throw error;
    }
  },

  deleteEmotionMapping: async (userId: string, emotionId: number): Promise<void> => {
    try {
      await api.delete(
        `/api/users/${userId}/emotionMappings`,
        { 
          data: { emotionId } 
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'emotion_mapping',
        'deleted',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { userId, emotionId }
      );

      messageHandler.success('Emotion mapping deleted');
    } catch (error) {
      messageHandler.error('Failed to delete emotion mapping');
      throw error;
    }
  }
};

export const emotionMappingsApi = USE_MOCK_API ? mockEmotionMappingsApi : realEmotionMappingsApi