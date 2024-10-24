// src/lib/api_s/moodboard/index.ts

import axiosInstance from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import * as authManager from '../../../utils/TokenManagement/authManager';
import {
  MoodEntry,
  MoodHistoryItem,
  MoodHistoryQuery,
  TimeRange
} from '../../../components/EN/types/moodHistory';
import { emotionMappingsApi } from '../reactions/emotionMappings';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

// Type for the save entry payload
export type SaveMoodEntryPayload = Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>;

export const moodboardApi = {
  saveMoodEntry: async (entry: SaveMoodEntryPayload): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Validate required fields
      const requiredFields = ['emotionId', 'color', 'volume', 'sources', 'date', 'tenantId'] as const;
      const missingFields = requiredFields.filter(field => !entry[field]);
      
      if (missingFields.length > 0) {
        messageHandler.error(`Missing required fields: ${missingFields.join(', ')}`);
        
        // Record validation failure metric
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'mood_entry',
          'validation_failed',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { missingFields }
        );
        
        throw new Error('Missing required fields for mood entry');
      }

      // Show saving message
      messageHandler.info('Saving mood entry...');

      const response = await axiosInstance.post('/api/moodboard/saveMoodEntry', entry);

      // Record success metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'mood_entry',
        'saved',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          emotionId: entry.emotionId,
          tenantId: entry.tenantId,
          duration: Date.now() - startTime
        }
      );

      messageHandler.success('Mood entry saved successfully');
      return response.data;

    } catch (error) {
      // Record error metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'mood_entry',
        'save_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          errorType: error instanceof Error ? error.name : 'unknown',
          duration: Date.now() - startTime
        }
      );

      messageHandler.error('Failed to save mood entry');
      throw error;
    }
  },

  fetchMoodHistory: async (query: MoodHistoryQuery): Promise<MoodHistoryItem[]> => {
    const startTime = Date.now();
    
    try {
      messageHandler.info('Fetching mood history...');

      const [moodHistoryResponse, emotionMappingsResponse] = await Promise.all([
        axiosInstance.get<any[]>('/api/moodboard/moodHistory', { params: query }),
        emotionMappingsApi.getEmotionMappings(query.emotion as unknown as string)
      ]);

      // Record fetch success metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'mood_history',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS
      );

      return transformMoodHistoryResponse(moodHistoryResponse.data, emotionMappingsResponse);

    } catch (error) {
      // Record error metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'mood_history',
        'fetch_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          errorType: error instanceof Error ? error.name : 'unknown',
          duration: Date.now() - startTime
        }
      );

      messageHandler.error('Failed to fetch mood history');
      throw error;
    }
  }
};

// Helper function to transform mood history response
function transformMoodHistoryResponse(data: any[], emotionMappings: any[]): MoodHistoryItem[] {
  const emotionColorMap = emotionMappings.reduce(
    (acc, emotion) => ({
      ...acc,
      [emotion.emotionName]: emotion.color,
    }),
    {} as Record<string, string>
  );

  return data.map(item => ({
    userId: item.userId,
    emotionName: item.emotionName,
    date: new Date(item.date.$date).toISOString(),
    volume: item.volume,
    sources: item.sources,
    color: emotionColorMap[item.emotionId] || '#CCCCCC',
    source: item.source,
    emotionId: item.emotionId,
    timeStamp: item.timeStamp,
    tenantId: item.tenantId,
    createdAt: new Date(item.createdAt.$date).toISOString(),
    updatedAt: new Date(item.updatedAt.$date).toISOString(),
    deletedAt: item.deletedAt ? new Date(item.deletedAt.$date).toISOString() : null,
  }));
}

export { getStartDate } from '../../../utils/dateUtil';