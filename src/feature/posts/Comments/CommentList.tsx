// src/features/posts/components/Comments/CommentList.tsx
import React, { useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Button,
  Divider
} from '@mui/material';
import { Refresh, Warning } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useComments } from '../hooks/useComments';
import { useInView } from 'react-intersection-observer';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';

interface CommentListProps {
  postId: string;
}

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { 
    comments,
    loading,
    error,
    hasMore,
    addComment,
    updateComment,
    deleteComment,
    loadMore,
    refresh
  } = useComments(postId);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
    rootMargin: '100px'
  });

  React.useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loadMore, loading]);

  const handleAddComment = useCallback(async (content: string) => {
    try {
      await addComment(content);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to add comment:', err);
    }
  }, [addComment]);

  const handleUpdateComment = useCallback(async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  }, [updateComment]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }, [deleteComment]);

  return (
    <Box className="space-y-4">
      <Box sx={{ mb: 3 }}>
        <CommentForm 
          onSubmit={handleAddComment}
          placeholder="Write a comment..."
          isLoading={loading}
          error={error}
        />
      </Box>

      <Divider />
      
      <AnimatePresence mode="popLayout">
        {comments.map(comment => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            layout
          >
            <CommentItem
              comment={comment}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
              onReply={handleAddComment}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {loading && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            py: 2 
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Alert 
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={refresh}
              startIcon={<Refresh />}
            >
              Retry
            </Button>
          }
        >
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      )}

      {!loading && !error && comments.length === 0 && (
        <Typography
          color="textSecondary"
          align="center"
          sx={{ py: 4 }}
        >
          No comments yet. Be the first to comment!
        </Typography>
      )}
      
      {hasMore && (
        <Box
          ref={ref}
          sx={{
            height: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            my: 2
          }}
        />
      )}
    </Box>
  );
};