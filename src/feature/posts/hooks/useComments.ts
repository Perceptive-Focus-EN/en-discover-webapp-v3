// src/features/posts/hooks/useComments.ts
import { useState, useCallback, useEffect } from 'react';
import { Comment, commentApi } from '../api/commentApi';

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchComments = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    try {
      const { comments: newComments, hasMore: more } = await commentApi.list(postId, page);
      setComments(prev => [...prev, ...newComments]);
      setHasMore(more);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [postId, page, hasMore, loading]);

  const addComment = useCallback(async (content: string, parentId?: string) => {
    try {
      const newComment = await commentApi.create(postId, { content, parentId });
      if (parentId) {
        // Update reply count for parent comment
        setComments(prev => prev.map(comment => 
          comment.id === parentId
            ? { ...comment, replyCount: comment.replyCount + 1 }
            : comment
        ));
      } else {
        setComments(prev => [newComment, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    }
  }, [postId]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const updatedComment = await commentApi.update(postId, commentId, content);
      setComments(prev => prev.map(comment =>
        comment.id === commentId ? updatedComment : comment
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      throw err;
    }
  }, [postId]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await commentApi.delete(postId, commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      throw err;
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    hasMore,
    addComment,
    updateComment,
    deleteComment,
    loadMore: fetchComments
  };
};
