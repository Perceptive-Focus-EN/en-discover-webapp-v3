// src/features/posts/hooks/useComments.ts
import { useState, useCallback, useEffect } from 'react';
import { Comment, commentApi } from '../api/commentApi';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  addComment: (content: string, parentId?: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useComments = (postId: string): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchComments = useCallback(async (resetPage = false) => {
    if ((!hasMore && !resetPage) || loading) return;
    
    const fetchStartTime = Date.now();
    setLoading(true);
    setError(null);

    try {
      const currentPage = resetPage ? 1 : page;
      const { comments: newComments, hasMore: more } = await commentApi.list(postId, currentPage);
      
      setComments(prev => resetPage ? newComments : [...prev, ...newComments]);
      setHasMore(more);
      setPage(prev => resetPage ? 2 : prev + 1);

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'comments',
        'fetch_duration',
        Date.now() - fetchStartTime,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          postId,
          page: currentPage,
          commentCount: newComments.length
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
      messageHandler.error(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comments',
        'fetch_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          page,
          error: errorMessage
        }
      );
    } finally {
      setLoading(false);
    }
  }, [postId, page, hasMore, loading]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    const addStartTime = Date.now();
    try {
      const newComment = await commentApi.create(postId, { content, parentId });
      
      if (parentId) {
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replyCount: comment.replyCount + 1 }
            : comment
        ));
      } else {
        setComments(prev => [newComment, ...prev]);
      }

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'comments',
        'add_success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          hasParent: !!parentId,
          duration: Date.now() - addStartTime
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      messageHandler.error(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comments',
        'add_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          hasParent: !!parentId,
          error: errorMessage
        }
      );
      throw err;
    }
  }, [postId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    const updateStartTime = Date.now();
    try {
      const updatedComment = await commentApi.update(postId, commentId, content);
      setComments(prev => prev.map(comment =>
        comment.id === commentId ? updatedComment : comment
      ));

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'comments',
        'update_success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          duration: Date.now() - updateStartTime
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update comment';
      setError(errorMessage);
      messageHandler.error(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comments',
        'update_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          error: errorMessage
        }
      );
      throw err;
    }
  }, [postId]);

  const deleteComment = useCallback(async (commentId: string) => {
    const deleteStartTime = Date.now();
    try {
      await commentApi.delete(postId, commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'comments',
        'delete_success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          duration: Date.now() - deleteStartTime
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(errorMessage);
      messageHandler.error(errorMessage);

      monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'comments',
        'delete_error',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          postId,
          commentId,
          error: errorMessage
        }
      );
      throw err;
    }
  }, [postId]);

  const refresh = useCallback(() => fetchComments(true), [fetchComments]);

  useEffect(() => {
    fetchComments(true);
  }, [postId]); // Reset and fetch when postId changes

  return {
    comments,
    loading,
    error,
    hasMore,
    addComment,
    updateComment,
    deleteComment,
    loadMore: fetchComments,
    refresh
  };
};