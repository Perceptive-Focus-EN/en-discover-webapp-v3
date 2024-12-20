import { useState, useCallback, useEffect } from 'react';
import { Post, Visibility } from '../api/types';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface UsePostEngagementProps {
  post: Post;
  onShare?: (platform: string, postId: string) => Promise<void>;
  onBookmark?: (postId: string) => Promise<void>;
  onVisibilityChange?: (postId: string, visibility: Visibility) => Promise<void>;
  initialBookmarkState?: boolean;
}

interface EngagementMetrics {
  shareCount: number;
  bookmarkCount: number;
  reactionCount: number;
}

export const usePostEngagement = ({ 
  post, 
  onShare, 
  onBookmark,
  onVisibilityChange,
  initialBookmarkState = false
}: UsePostEngagementProps) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarkState);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Safe initialization of metrics with null checks
  const getInitialMetrics = (post: Post): EngagementMetrics => ({
    shareCount: post?.metadata?.shareCount || 0,
    bookmarkCount: post?.metadata?.bookmarkCount || 0,
    reactionCount: Array.isArray(post?.reactions) ? post.reactions.length : 0
  });

  const [metrics, setMetrics] = useState<EngagementMetrics>(() => 
    getInitialMetrics(post)
  );

  // Update metrics when post changes with safe access
  useEffect(() => {
    setMetrics(getInitialMetrics(post));
  }, [post]);

  const handleShare = useCallback(async (platform: string) => {
    if (!post?.id) return;
    
    setIsProcessing(true);
    try {
      await onShare?.(platform, post.id);
      setMetrics(prev => ({
        ...prev,
        shareCount: prev.shareCount + 1
      }));
      messageHandler.success(`Post shared on ${platform}`);
    } catch (error) {
      messageHandler.error('Failed to share post');
      console.error('Share error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [post?.id, onShare]);

  const handleBookmark = useCallback(async () => {
    if (isProcessing || !post?.id) return;
    
    setIsProcessing(true);
    try {
      await onBookmark?.(post.id);
      setIsBookmarked(prev => !prev);
      setMetrics(prev => ({
        ...prev,
        bookmarkCount: prev.bookmarkCount + (isBookmarked ? -1 : 1)
      }));
      messageHandler.success(
        isBookmarked ? 'Post removed from bookmarks' : 'Post bookmarked'
      );
    } catch (error) {
      messageHandler.error('Failed to bookmark post');
      console.error('Bookmark error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [post?.id, onBookmark, isBookmarked, isProcessing]);

  const handleVisibilityChange = useCallback(async (visibility: Visibility) => {
    if (isProcessing || !post?.id) return;

    setIsProcessing(true);
    try {
      await onVisibilityChange?.(post.id, visibility);
      messageHandler.success(`Post visibility changed to ${visibility}`);
    } catch (error) {
      messageHandler.error('Failed to change post visibility');
      console.error('Visibility change error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [post?.id, onVisibilityChange, isProcessing]);

  return {
    // States
    isBookmarked,
    isProcessing,
    metrics,

    // Handlers
    handleShare,
    handleBookmark,
    handleVisibilityChange,

    // Post data with safe access
    visibility: post?.visibility,
    type: post?.type,
    authorId: post?.authorId,
    createdAt: post?.createdAt,
    updatedAt: post?.updatedAt,
    isEdited: post?.isEdited
  };
};