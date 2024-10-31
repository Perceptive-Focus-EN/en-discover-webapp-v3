// src/lib/api_s/reactions/postReactions.ts
import { api } from '../../axiosSetup';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { PostReaction, EmotionId } from '../../../feature/types/Reaction';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

interface ReactionResponse {
  reactions: PostReaction[];
  success: boolean;
  message: string;
}

interface PostWithReactions {
  post: {
    id: string;
    content: string;
    reactions: PostReaction[];
  };
}

export const postReactionsApi = {
  fetch: async (postId: string): Promise<PostReaction[]> => {
    try {
      const response = await api.get<ReactionResponse>(
        `/api/posts/${postId}/reactions`
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'reactions',
        'fetch_count',
        response.reactions.length,
        MetricType.GAUGE,
        MetricUnit.COUNT,
        { postId }
      );

      return response.reactions;
    } catch (error) {
      messageHandler.error('Failed to fetch reactions');
      throw error;
    }
  },

  fetchPostWithReactions: async (postId: string): Promise<PostWithReactions> => {
    try {
      const response = await api.get<PostWithReactions>(
        `/api/posts/${postId}`
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'reactions',
        'post_reactions_count',
        response.post.reactions.length,
        MetricType.GAUGE,
        MetricUnit.COUNT,
        { postId }
      );

      return response;
    } catch (error) {
      messageHandler.error('Failed to fetch post with reactions');
      throw error;
    }
  },

  update: async (postId: string, emotionId: EmotionId): Promise<PostReaction[]> => {
    try {
      const response = await api.post<ReactionResponse>(
        `/api/posts/${postId}/reactions`,
        { emotionId }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'reactions',
        'updated',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { postId, emotionId }
      );

      messageHandler.success('Reaction updated successfully');
      return response.reactions;
    } catch (error) {
      messageHandler.error('Failed to update reaction');
      throw error;
    }
  }
};