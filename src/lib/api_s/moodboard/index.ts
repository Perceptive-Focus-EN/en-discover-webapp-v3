// src/lib/api_s/moodboard/index.ts
import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import {
  MoodEntry,
  MoodHistoryItem,
  MoodHistoryQuery,
} from '../../../components/EN/types/moodHistory';
import { emotionMappingsApi } from '../reactions/emotionMappings';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { BusinessError } from '@/MonitoringSystem/constants/errors';

export type SaveMoodEntryPayload = Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>;

interface MoodHistoryResponse {
  userId: string;
  emotionName: string;
  date: { $date: string };
  volume: number;
  sources: string[];
  emotionId: string;
  timeStamp: string;
  tenantId: string;
  createdAt: { $date: string };
  updatedAt: { $date: string };
  deletedAt?: { $date: string };
  source?: string;
}

export const moodboardApi = {
  saveMoodEntry: async (entry: SaveMoodEntryPayload): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const requiredFields = ['emotionId', 'color', 'volume', 'sources', 'date', 'tenantId'] as const;
      const missingFields = requiredFields.filter(field => !entry[field]);
      
      if (missingFields.length > 0) {
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'mood_entry',
          'validation_failed',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { missingFields }
        );
        
        throw monitoringManager.error.createError(
          'business',
          BusinessError.VALIDATION_FAILED,
          `Missing required fields: ${missingFields.join(', ')}`,
          { missingFields }
        );
      }

      messageHandler.info('Saving mood entry...');

      const response = await api.post<void>(
        '/api/moodboard/saveMoodEntry',
        entry
      );

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
      return response;

    } catch (error) {
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

      throw error;
    }
  },

  fetchMoodHistory: async (query: MoodHistoryQuery): Promise<MoodHistoryItem[]> => {
    const startTime = Date.now();
    
    try {
      messageHandler.info('Fetching mood history...');

      const [moodHistoryResponse, emotionMappingsResponse] = await Promise.all([
        api.get<MoodHistoryResponse[]>('/api/moodboard/moodHistory', { params: query }),
        emotionMappingsApi.getEmotionMappings(query.emotion as unknown as string)
      ]);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'mood_history',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          resultCount: moodHistoryResponse.length
        }
      );

      return transformMoodHistoryResponse(moodHistoryResponse, emotionMappingsResponse);

    } catch (error) {
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

      throw error;
    }
  }
};

function transformMoodHistoryResponse(
  data: MoodHistoryResponse[],
  emotionMappings: any[]
): MoodHistoryItem[] {
  const emotionColorMap = emotionMappings.reduce(
    (acc, emotion) => ({
      ...acc,
      [emotion.emotionName]: emotion.color,
    }),
    {} as Record<string, string>
  );

  return data.map(item => ({
    userId: item.userId,
    emotionName: item.emotionName as "EUPHORIC" | "TRANQUIL" | "REACTIVE" | "SORROW" | "FEAR" | "DISGUST" | "SUSPENSE" | "ENERGY",
    date: new Date(item.date.$date).toISOString(),
    volume: item.volume as 1 | 2 | 3 | 4,
    sources: item.sources.map(source => parseInt(source) as 2 | 4 | 6 | 1 | 3 | 5 | 7),
    color: emotionColorMap[item.emotionId] || '#CCCCCC',
    source: item.source,
    emotionId: parseInt(item.emotionId) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
    timeStamp: item.timeStamp,
    tenantId: item.tenantId,
    createdAt: new Date(item.createdAt.$date).toISOString(),
    updatedAt: new Date(item.updatedAt.$date).toISOString(),
    deletedAt: item.deletedAt ? new Date(item.deletedAt.$date).toISOString() : null,
  }));
}

export { getStartDate } from '../../../utils/dateUtil';