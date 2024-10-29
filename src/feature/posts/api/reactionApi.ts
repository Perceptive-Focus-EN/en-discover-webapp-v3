// src/features/posts/api/reactionApi.ts
import { EmotionId, EmotionName, Reaction, ReactionCount, ReactionCountResponse, ReactionMetrics, ReactionResponse, ReactionSummary} from '@/feature/types/Reaction';
import { clientApi } from '@/lib/api_s/client';
import { apiRequest } from '@/lib/api_s/client/utils';
import { PaginatedResponse, PaginationParams } from '@/types/pagination';

export const reactionApi = {
  /**
   * Create a reaction
   */
  create: async (postId: string, emotionId: EmotionId): Promise<Reaction> => {
    const response = await apiRequest.post<ReactionResponse>(
      `/api/posts/${postId}/reactions`,
      { emotionId }
    );
    return response.data.data;
  },

  /**
   * Delete a reaction
   */
  delete: async (postId: string, reactionId: string): Promise<void> => {
    await apiRequest.delete(`/api/posts/${postId}/reactions/${reactionId}`);
  },

  /**
   * List reactions for a post with pagination
   */
  list: async (
    postId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Reaction>> => {
    return clientApi.getPaginated<Reaction>(
      `/api/posts/${postId}/reactions`,
      params
    );
  },

  /**
   * Get reaction summary for a post
   */
  getSummary: async (postId: string): Promise<ReactionSummary[]> => {
    const response = await apiRequest.get<{ data: ReactionSummary[] }>(
      `/api/posts/${postId}/reactions/summary`
    );
    return response.data.data;
  },

  /**
   * Get reaction counts
   */
  getCounts: async (postId: string): Promise<ReactionCount[]> => {
    const response = await apiRequest.get<ReactionCountResponse>(
      `/api/posts/${postId}/reactions/counts`
    );
    return response.data.data;
  },

  /**
   * Toggle a reaction
   */
  toggle: async (postId: string, emotionId: EmotionId): Promise<Reaction> => {
    const response = await apiRequest.put<ReactionResponse>(
      `/api/posts/${postId}/reactions/toggle`,
      { emotionId }
    );
    return response.data.data;
  },

  /**
   * Get user's reaction to a post
   */
  getUserReaction: async (postId: string): Promise<Reaction | null> => {
    try {
      const response = await apiRequest.get<{ data: Reaction }>(
        `/api/posts/${postId}/reactions/me`
      );
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Batch get reactions for multiple posts
   */
  batchGetSummaries: async (postIds: string[]): Promise<Record<string, ReactionSummary[]>> => {
    const response = await apiRequest.post<{ data: Record<string, ReactionSummary[]> }>(
      '/api/posts/reactions/batch',
      { postIds }
    );
    return response.data.data;
  },

  /**
   * Get advanced reaction metrics for a post
   */
  getMetrics: async (postId: string): Promise<ReactionMetrics> => {
    const response = await apiRequest.get<{ data: ReactionMetrics }>(
      `/api/posts/${postId}/reactions/metrics`
    );
    return response.data.data;
  },

  /**
   * Get reaction metrics for multiple posts
   */
  batchGetMetrics: async (postIds: string[]): Promise<Record<string, ReactionMetrics>> => {
    const response = await apiRequest.post<{ data: Record<string, ReactionMetrics> }>(
      '/api/posts/reactions/metrics/batch',
      { postIds }
    );
    return response.data.data;
  },

  /**
   * Get reaction trends over time
   */
  getTrends: async (
    postId: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    timestamps: string[];
    data: Record<EmotionName, number[]>;
  }> => {
    const response = await apiRequest.get<{
      data: {
        timestamps: string[];
        data: Record<EmotionName, number[]>;
      };
    }>(`/api/posts/${postId}/reactions/trends`, {
      params: { timeframe }
    });
    return response.data.data;
  },

  /**
   * Get user's reaction history
   */
  getUserHistory: async (
    params: PaginationParams & {
      emotionId?: EmotionId;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PaginatedResponse<Reaction>> => {
    return clientApi.getPaginated<Reaction>(
      '/api/users/me/reactions',
      params
    );
  }
};