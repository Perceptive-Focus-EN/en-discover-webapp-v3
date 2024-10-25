// src/contexts/MoodBoardContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { moodboardApi, getStartDate, SaveMoodEntryPayload } from '../lib/api_s/moodboard/index';
import { MoodHistoryItem, MoodHistoryQuery, TimeRange, MoodEntry } from '../components/EN/types/moodHistory';
import { emotionMappingsApi } from '../lib/api_s/reactions/emotionMappings';
import { Emotion } from '../components/EN/types/emotions';
import { postReactionsApi} from '../lib/api_s/reactions/postReactions';
import { EmotionId, Reaction } from '@/components/Feed/types/Reaction';
import { PostData } from '../components/Feed/types/Post';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface MoodBoardContextType {
  moodHistory: MoodHistoryItem[];
  emotions: Emotion[];
  isLoading: boolean;
  error: string | null;
  fetchMoodData: (query: MoodHistoryQuery) => Promise<void>;
  getStartDate: (timeRange: TimeRange) => Date;
  saveMoodEntry: (entry: SaveMoodEntryPayload) => Promise<void>;
  getEmotionMappings: (userId: string) => Promise<Emotion[]>;
  saveEmotionMappings: (userId: string, emotions: Emotion[]) => Promise<void>;
  updateEmotionMapping: (userId: string, emotion: Emotion) => Promise<void>;
  fetchPostReactions: (postId: string) => Promise<Reaction[]>;
  updatePostReaction: (postId: string, emotionId: EmotionId) => Promise<Reaction[]>;
  fetchPostWithReactions: (postId: string) => Promise<PostData>;
  clearError: () => void;
}

export const MoodBoardContext = createContext<MoodBoardContextType | undefined>(undefined);

export const useMoodBoard = () => {
  const context = useContext(MoodBoardContext);
  if (!context) {
    throw new Error('useMoodBoard must be used within a MoodBoardProvider');
  }
  return context;
};

export const MoodBoardProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [moodHistory, setMoodHistory] = useState<MoodHistoryItem[]>([]);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchMoodData = useCallback(async (query: MoodHistoryQuery) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const data = await moodboardApi.fetchMoodHistory(query);
      setMoodHistory(data);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'mood_board',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { timeRange: query.timeRange }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mood data';
      setError(errorMessage);
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'mood_board',
        'fetch_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage }
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveMoodEntryData = useCallback(async (entry: SaveMoodEntryPayload) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      await moodboardApi.saveMoodEntry(entry);
      
      const emotion = emotions.find(e => e.id === entry.emotionId);
      if (emotion) {
        await fetchMoodData({
          emotion,
          timeRange: 'day',
          startDate: '',
          endDate: ''
        });
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'mood_entry',
        'save_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { emotionId: entry.emotionId }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save mood entry';
      setError(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'mood_entry',
        'save_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage }
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [emotions, fetchMoodData]);

  // src/contexts/MoodBoardContext.tsx
const getEmotionMappings = useCallback(async (userId?: string) => {
  const startTime = Date.now();
  setIsLoading(true);
  setError(null);

  try {
    if (!userId) {
      throw monitoringManager.error.createError(
        'business',
        'AUTH_REQUIRED',
        'Authentication required to fetch emotion mappings'
      );
    }

    const data = await emotionMappingsApi.getEmotionMappings(userId);
    setEmotions(data);

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'emotion_mappings',
      'fetch_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { userId }
    );

    return data;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emotion mappings';
    setError(errorMessage);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'emotion_mappings',
      'fetch_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { error: errorMessage, userId: userId || 'undefined' }
    );
    throw err;
  } finally {
    setIsLoading(false);
  }
}, []);


  const saveEmotionMappings = useCallback(async (userId: string, emotions: Emotion[]) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      await emotionMappingsApi.saveEmotionMappings(userId, emotions);
      setEmotions(emotions);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'emotion_mappings',
        'save_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { userId, emotionCount: emotions.length }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save emotion mappings';
      setError(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'emotion_mappings',
        'save_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage, userId }
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEmotionMapping = useCallback(async (userId: string, emotion: Emotion) => {
    const startTime = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      await emotionMappingsApi.updateEmotionMapping(userId, emotion.id, emotion);
      setEmotions(prevEmotions => prevEmotions.map(e => e.id === emotion.id ? emotion : e));

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'emotion_mapping',
        'update_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { userId, emotionId: emotion.id }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update emotion mapping';
      setError(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'emotion_mapping',
        'update_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage, userId, emotionId: emotion.id }
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPostReactionsData = useCallback(async (postId: string) => {
    const startTime = Date.now();
    try {
      const reactions = await  postReactionsApi.fetchPostWithReactions(postId);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'post_reactions',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { postId }
      );

      return reactions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch post reactions';
      setError(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'post_reactions',
        'fetch_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage, postId }
      );
      throw err;
    }
  }, []);

  const updatePostReactionData = useCallback(async (postId: string, emotionId: EmotionId) => {
    const startTime = Date.now();
    try {
      const reactions = await postReactionsApi.update(postId, emotionId);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'post_reaction',
        'update_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { postId, emotionId }
      );

      return reactions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post reaction';
      setError(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'post_reaction',
        'update_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage, postId, emotionId }
      );
      throw err;
    }
  }, []);

  const fetchPostWithReactionsData = useCallback(async (postId: string) => {
    const startTime = Date.now();
    try {
      const post = await  postReactionsApi.fetchPostWithReactions(postId);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'post_with_reactions',
        'fetch_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        { postId }
      );

      return post;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch post with reactions';
      setError(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'post_with_reactions',
        'fetch_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { error: errorMessage, postId }
      );
      throw err;
    }
  }, []);

  const value = {
    moodHistory,
    emotions,
    isLoading,
    error,
    fetchMoodData,
    getStartDate,
    saveMoodEntry: saveMoodEntryData,
    getEmotionMappings,
    saveEmotionMappings,
    updateEmotionMapping,
    fetchPostReactions: fetchPostReactionsData,
    updatePostReaction: updatePostReactionData,
    fetchPostWithReactions: fetchPostWithReactionsData,
    clearError
  };

  return <MoodBoardContext.Provider value={value}>{children}</MoodBoardContext.Provider>;
};