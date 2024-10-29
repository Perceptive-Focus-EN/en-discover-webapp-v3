// src/features/posts/hooks/useReactions.ts
import { useState, useCallback, useEffect } from 'react';
import { Reaction, EmotionId, ReactionSummary, ReactionMetrics } from '@/feature/types/Reaction';
import { reactionApi } from '../api/reactionApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const useReactions = (postId: string) => {
  const [summary, setSummary] = useState<ReactionSummary[]>([]);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [metrics, setMetrics] = useState<ReactionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadReactionData = async () => {
      setIsLoading(true);
      try {
        const [summaryData, userReactionData, metricsData] = await Promise.all([
          reactionApi.getSummary(postId),
          reactionApi.getUserReaction(postId),
          reactionApi.getMetrics(postId)
        ]);

        setSummary(summaryData);
        setUserReaction(userReactionData);
        setMetrics(metricsData);
      } catch (error) {
        messageHandler.error('Failed to load reactions');
        console.error('Reaction loading error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReactionData();
  }, [postId]);

  // Handle reaction toggle
  const toggleReaction = useCallback(async (emotionId: EmotionId) => {
    setIsLoading(true);
    try {
      const updatedReaction = await reactionApi.toggle(postId, emotionId);
      
      // Update user reaction
      setUserReaction(updatedReaction);
      
      // Refresh summary to get updated counts
      const updatedSummary = await reactionApi.getSummary(postId);
      setSummary(updatedSummary);

      // Optionally refresh metrics if needed
      const updatedMetrics = await reactionApi.getMetrics(postId);
      setMetrics(updatedMetrics);

    } catch (error) {
      messageHandler.error('Failed to update reaction');
      console.error('Reaction toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // Get reaction counts
  const getReactionCounts = useCallback(async () => {
    try {
      return await reactionApi.getCounts(postId);
    } catch (error) {
      messageHandler.error('Failed to get reaction counts');
      console.error('Reaction counts error:', error);
      return [];
    }
  }, [postId]);

  // Get reaction trends
  const getReactionTrends = useCallback(async (
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) => {
    try {
      return await reactionApi.getTrends(postId, timeframe);
    } catch (error) {
      messageHandler.error('Failed to get reaction trends');
      console.error('Reaction trends error:', error);
      return null;
    }
  }, [postId]);

  return {
    summary,
    userReaction,
    metrics,
    isLoading,
    toggleReaction,
    getReactionCounts,
    getReactionTrends,
    hasReacted: !!userReaction,
    totalReactions: metrics?.totalReactions || 0,
  };
};