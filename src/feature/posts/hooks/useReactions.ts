import { useState, useCallback, useEffect } from 'react';
import { Reaction, EmotionId, ReactionSummary, ReactionMetrics } from '@/feature/types/Reaction';
import { reactionApi, EmotionType } from '../api/reactionApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { useAuth } from '@/contexts/AuthContext';

interface FormattedReaction {
  emotionId: EmotionId;
  count: number;
  emotionName: string;
  color?: string;
}

export const useReactions = (postId: string) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReactionSummary[]>([]);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [metrics, setMetrics] = useState<ReactionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formattedReactions, setFormattedReactions] = useState<FormattedReaction[]>([]);

  // Format reactions for UI consumption
  const formatReactions = useCallback((summaryData: ReactionSummary[]) => {
    return EmotionType.map(emotion => {
      const reactionData = summaryData.find(r => r.type === emotion.emotionName);
      return {
        emotionId: emotion.id,
        emotionName: emotion.emotionName,
        count: reactionData?.count || 0,
        color: reactionData?.color
      };
    }).filter(reaction => reaction.count > 0);
  }, []);

  // Batch processing for metrics
  const processBatchedMetrics = useCallback((metricsData: any[]) => {
    const batchSize = 100;
    for (let i = 0; i < metricsData.length; i += batchSize) {
      const batch = metricsData.slice(i, i + batchSize);
      console.log('Processing batch:', batch);
    }
  }, []);

  // Enhanced retry logic
  const fetchWithRetry = useCallback(async (fn: () => Promise<any>, maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i === maxRetries - 1) throw lastError;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadReactionData = async () => {
      setIsLoading(true);
      try {
        const [summaryData, userReactionData, metricsData] = await Promise.all([
          fetchWithRetry(() => reactionApi.getSummary(postId)),
          user ? fetchWithRetry(() => reactionApi.getUserReaction(postId)) : null,
          fetchWithRetry(() => reactionApi.getMetrics(postId))
        ]);

        setSummary(summaryData);
        setUserReaction(userReactionData);
        setMetrics(metricsData);
        setFormattedReactions(formatReactions(summaryData));
        processBatchedMetrics(metricsData);
      } catch (error) {
        messageHandler.error('Failed to load reactions');
        console.error('Reaction loading error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReactionData();
  }, [postId, user, fetchWithRetry, processBatchedMetrics, formatReactions]);

  // Enhanced toggleReaction
  const toggleReaction = useCallback(async (emotionId: EmotionId) => {
    if (!user) {
      messageHandler.error('Please login to react');
      return;
    }

    if (!reactionApi.getEmotionDetails(emotionId)) {
      messageHandler.error('Invalid emotion selected');
      return;
    }

    setIsLoading(true);
    const previousReaction = userReaction;
    
    // Optimistic update
    setUserReaction(prevReaction => 
      prevReaction?.emotionId === emotionId ? null : { emotionId } as Reaction
    );

    try {
      const updatedReaction = await fetchWithRetry(() => 
        reactionApi.toggle(postId, emotionId)
      );
      
      setUserReaction(updatedReaction);

      // Refresh data
      const [updatedSummary, updatedMetrics] = await Promise.all([
        fetchWithRetry(() => reactionApi.getSummary(postId)),
        fetchWithRetry(() => reactionApi.getMetrics(postId))
      ]);

      setSummary(updatedSummary);
      setMetrics(updatedMetrics);
      setFormattedReactions(formatReactions(updatedSummary));
      processBatchedMetrics(updatedMetrics);

    } catch (error) {
      setUserReaction(previousReaction);
      messageHandler.error('Failed to update reaction');
      console.error('Reaction toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [postId, user, userReaction, fetchWithRetry, processBatchedMetrics, formatReactions]);

  // Additional utility functions remain the same
  const getReactionCounts = useCallback(async () => {
    try {
      return await fetchWithRetry(() => reactionApi.getCounts(postId));
    } catch (error) {
      messageHandler.error('Failed to get reaction counts');
      console.error('Reaction counts error:', error);
      return [];
    }
  }, [postId, fetchWithRetry]);

  const getReactionTrends = useCallback(async (
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) => {
    try {
      return await fetchWithRetry(() => reactionApi.getTrends(postId, timeframe));
    } catch (error) {
      messageHandler.error('Failed to get reaction trends');
      console.error('Reaction trends error:', error);
      return null;
    }
  }, [postId, fetchWithRetry]);

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
    canReact: !!user,
    reactions: formattedReactions, // New formatted reactions for UI
    emotionTypes: EmotionType // Expose emotion types for components
  };
};