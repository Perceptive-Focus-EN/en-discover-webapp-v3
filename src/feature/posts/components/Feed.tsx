// src/features/posts/components/Feed.tsx
import { useEffect } from 'react';
import { PostCard } from './factory/PostCardFactory';
import { usePost } from '../hooks/usePost';
import { CircularProgress, Typography } from '@mui/material';
import { useInView } from 'react-intersection-observer';
import { Post } from '../api/types';

export const SafePostCard: React.FC<{ post: Post }> = ({ post }) => {
  const safePost = {
    ...post,
    reactions: post.reactions || [],
    reactionMetrics: post.reactionMetrics || {
      totalCount: 0,
      distribution: {
        EUPHORIC: 0,
        TRANQUIL: 0,
        REACTIVE: 0,
        SORROW: 0,
        ANGER: 0,
        SURPRISE: 0,
        FEAR: 0,
        DISGUST: 0,
        SUSPENSE: 0,
        ENERGY: 0
      },
      recentReactions: []
    }
  };

  return <PostCard post={safePost} />;
};

export const Feed: React.FC = () => {
  const { 
    posts, 
    isLoading, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = usePost();
  
  // For infinite scroll
  const { ref, inView } = useInView({
    threshold: 0
  });

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  if (error) {
    return (
      <Typography 
        color="error" 
        className="text-center p-4" 
        onClick={refresh}
        sx={{ cursor: 'pointer' }}
      >
        Error loading posts. Click to retry.
      </Typography>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {posts.map(post => (
        <SafePostCard
          key={post.id}
          post={post}
        />
      ))}
      {/* Loading/Infinite scroll trigger */}
      <div ref={ref} className="flex justify-center p-4">
        {isLoading && <CircularProgress size={24} />}
      </div>

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <Typography className="text-center p-4">
          No posts available
        </Typography>
      )}
    </div>
  );
};