// src/features/posts/api/commentApi.ts
import { clientApi } from '@/lib/api_s/client';
import { apiRequest } from '@/lib/api_s/client/utils';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  replyCount: number;
  isEdited: boolean;
  author: {
    name: string;
    avatar?: string;
  };
}

export interface CreateCommentDTO {
  content: string;
  parentId?: string;
}

export interface CommentResponse {
  data: Comment;
  message?: string;
}

export interface CommentsListResponse {
  data: {
    comments: Comment[];
    hasMore: boolean;
  };
  message?: string;
}

export interface RepliesResponse {
  data: {
    replies: Comment[];
    hasMore: boolean;
  };
  message?: string;
}

export const commentApi = {
  create: async (postId: string, data: CreateCommentDTO): Promise<Comment> => {
    const startTime = Date.now();
    try {
      const response = await apiRequest.post<CommentResponse>(
        `/api/posts/${postId}/comments`,
        data
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'comment',
        'create',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          hasParent: !!data.parentId,
          duration: Date.now() - startTime
        }
      );

      messageHandler.success('Comment added successfully');
      return response.data.data;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comment',
        'create_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          errorType: error instanceof Error ? error.name : 'unknown'
        }
      );
      messageHandler.error('Failed to add comment');
      throw error;
    }
  },

  list: async (postId: string, page = 1): Promise<{ 
    comments: Comment[];
    hasMore: boolean;
  }> => {
    const startTime = Date.now();
    try {
      const response = await apiRequest.get<CommentsListResponse>(
        `/api/posts/${postId}/comments`,
        { page }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'comment',
        'list_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          postId,
          page,
          commentCount: response.data.data.comments.length
        }
      );

      return response.data.data;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comment',
        'list_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          page,
          errorType: error instanceof Error ? error.name : 'unknown'
        }
      );
      messageHandler.error('Failed to load comments');
      throw error;
    }
  },

  update: async (
    postId: string,
    commentId: string,
    content: string
  ): Promise<Comment> => {
    const startTime = Date.now();
    try {
      const response = await apiRequest.put<CommentResponse>(
        `/api/posts/${postId}/comments/${commentId}`,
        { content }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'comment',
        'update',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          duration: Date.now() - startTime
        }
      );

      messageHandler.success('Comment updated successfully');
      return response.data.data;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comment',
        'update_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          errorType: error instanceof Error ? error.name : 'unknown'
        }
      );
      messageHandler.error('Failed to update comment');
      throw error;
    }
  },

  delete: async (postId: string, commentId: string): Promise<void> => {
    const startTime = Date.now();
    try {
      await apiRequest.delete(
        `/api/posts/${postId}/comments/${commentId}`
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'comment',
        'delete',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          duration: Date.now() - startTime
        }
      );

      messageHandler.success('Comment deleted successfully');
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comment',
        'delete_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          errorType: error instanceof Error ? error.name : 'unknown'
        }
      );
      messageHandler.error('Failed to delete comment');
      throw error;
    }
  },

  getReplies: async (
    postId: string,
    commentId: string,
    page = 1
  ): Promise<{
    replies: Comment[];
    hasMore: boolean;
  }> => {
    const startTime = Date.now();
    try {
      const response = await apiRequest.get<RepliesResponse>(
        `/api/posts/${postId}/comments/${commentId}/replies`,
        { page }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'comment',
        'replies_duration',
        Date.now() - startTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          postId,
          commentId,
          page,
          replyCount: response.data.data.replies.length
        }
      );

      return response.data.data;
    } catch (error) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comment',
        'replies_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          page,
          errorType: error instanceof Error ? error.name : 'unknown'
        }
      );
      messageHandler.error('Failed to load replies');
      throw error;
    }
  }
};