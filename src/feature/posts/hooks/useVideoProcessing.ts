// src/features/posts/hooks/useVideoProcessing.ts
import { useCallback, useEffect } from 'react';
import { usePost } from './usePost';
import { postApi } from '../api/postApi';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const useVideoProcessing = (postId: string | null) => {
  const { updatePost, getPostById } = usePost(); // Using the updated usePost hook

  const checkProcessingStatus = useCallback(async () => {
    if (!postId) return;

    try {
      const status = await postApi.getProcessingStatus(postId);

      const post = getPostById(postId);
      if (post && post.processingStatus !== status) {
        // Update post's processing status if it has changed
        await updatePost({
          id: postId,
          processingStatus: status,
        });
      }

      return status;
    } catch (error) {
      messageHandler.error('Failed to check video processing status');
      console.error('Processing status check failed:', error);
    }
  }, [postId, updatePost, getPostById]);

  useEffect(() => {
    if (postId) {
      const interval = setInterval(checkProcessingStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [postId, checkProcessingStatus]);

  return {
    checkProcessingStatus,
  };
};
