// src/contexts/MoodBoardContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { fetchMoodHistory, getStartDate } from '../lib/api_s/moodboard/moodHistoryApi';
import { MoodHistoryItem, MoodHistoryQuery, TimeRange, MoodEntry } from '../components/EN/types/moodHistory';
import { saveMoodEntry as saveMoodEntryApi } from '../lib/api_s/moodboard/saveMoodEntryApi';
import { emotionMappingsApi } from '../lib/api_s/reactions/emotionMappings';
import { Emotion } from '../components/EN/types/emotions';
import { fetchPostReactions, updatePostReaction, fetchPostWithReactions } from '../lib/api_s/reactions/postReactions';
import { EmotionId, Reaction } from '@/components/Feed/types/Reaction';
import { PostData, PostType, PostContent} from '../components/Feed/types/Post'; // Adjust the import path as needed
import { UserAccountType } from '../constants/AccessKey/accounts';
import { TenantInfo } from '../types/Tenant/interfaces';

interface MoodBoardContextType {
  moodHistory: MoodHistoryItem[];
  emotions: Emotion[];
  isLoading: boolean;
  error: string | null;
  fetchMoodData: (query: MoodHistoryQuery) => Promise<void>;
  getStartDate: (timeRange: TimeRange) => Date;
  saveMoodEntry: (entry: MoodEntry) => Promise<void>;
  getEmotionMappings: (userId: string) => Promise<Emotion[]>;
  saveEmotionMappings: (userId: string, emotions: Emotion[]) => Promise<void>;
  updateEmotionMapping: (userId: string, emotion: Emotion) => Promise<void>;
  fetchPostReactions: (postId: string) => Promise<Reaction[]>;
  updatePostReaction: (postId: string, emotionId: EmotionId) => Promise<Reaction[]>;
  fetchPostWithReactions: (postId: string) => Promise<PostData>;
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

  const fetchMoodData = useCallback(async (query: MoodHistoryQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMoodHistory(query);
      setMoodHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveMoodEntryData = useCallback(async (entry: Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      await saveMoodEntryApi(entry);
      const emotion = emotions.find(e => e.id === entry.emotionId);
      if (emotion) {
        await fetchMoodData({
          emotion, timeRange: 'day',
          startDate: '',
          endDate: ''
        });
      } else {
        throw new Error('Emotion not found');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
    }, [emotions, fetchMoodData]);

  const getEmotionMappings = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await emotionMappingsApi.getEmotionMappings(userId);
      setEmotions(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveEmotionMappings = useCallback(async (userId: string, emotions: Emotion[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await emotionMappingsApi.saveEmotionMappings(userId, emotions);
      setEmotions(emotions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEmotionMapping = useCallback(async (userId: string, emotion: Emotion) => {
    setIsLoading(true);
    setError(null);
    try {
      await emotionMappingsApi.updateEmotionMapping(userId, emotion.id, emotion);
      setEmotions(prevEmotions => prevEmotions.map(e => e.id === emotion.id ? emotion : e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPostReactionsData = useCallback(async (postId: string) => {
    try {
      return await fetchPostReactions(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      return [];
    }
  }, []);

  const updatePostReactionData = useCallback(async (postId: string, emotionId: EmotionId) => {
    try {
      return await updatePostReaction(postId, emotionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      throw err;
    }
  }, []);

  const fetchPostWithReactionsData = useCallback(async (postId: string) => {
    try {
      return await fetchPostWithReactions(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
  };

  return <MoodBoardContext.Provider value={value}>{children}</MoodBoardContext.Provider>;
};