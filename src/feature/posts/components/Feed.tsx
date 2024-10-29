// src/features/posts/components/Feed.tsx
import { useEffect } from 'react';
import { PostCard } from './factory/PostCardFactory';
import { usePost } from '../hooks/usePost';
import { Post } from '../api/types';
import { CircularProgress, Typography } from '@mui/material';
import { useInView } from 'react-intersection-observer';

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
        <PostCard
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