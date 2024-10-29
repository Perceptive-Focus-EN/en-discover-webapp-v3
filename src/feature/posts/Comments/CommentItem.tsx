// src/features/posts/components/Comments/CommentItem.tsx
import React, { useState, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Button,
  Tooltip,
  Menu,
  MenuItem,
  CircularProgress,
  Collapse,
  Avatar,
  Box
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Reply, 
  MoreVert,
  Warning 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Comment } from '../api/commentApi';
import { CommentForm } from './CommentForm';
import TimeAgo from 'react-timeago';
import { useAuth } from '@/contexts/AuthContext';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply: (content: string, parentId: string) => Promise<void>;
  onLoadReplies?: () => Promise<void>;
  showReplies?: boolean;
  depth?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onUpdate,
  onDelete,
  onReply,
  onLoadReplies,
  showReplies = false,
  depth = 0
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isAuthor = user?.userId === comment.userId;
  const maxDepth = 3; // Maximum nesting level for replies

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUpdate = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await onUpdate(comment.id, content);
      setIsEditing(false);
      messageHandler.success('Comment updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      messageHandler.error('Failed to update comment');
    } finally {
      setIsLoading(false);
    }
  }, [comment.id, onUpdate]);

  const handleReply = useCallback(async (content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await onReply(content, comment.id);
      setIsReplying(false);
      messageHandler.success('Reply added successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply');
      messageHandler.error('Failed to add reply');
    } finally {
      setIsLoading(false);
    }
  }, [comment.id, onReply]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await onDelete(comment.id);
      messageHandler.success('Comment deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      messageHandler.error('Failed to delete comment');
    } finally {
      setIsLoading(false);
      handleMenuClose();
    }
  }, [comment.id, onDelete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card 
        variant="outlined" 
        className="mb-2"
        sx={{ 
          ml: depth * 3,
          backgroundColor: isEditing ? 'action.hover' : 'background.paper'
        }}
      >
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Avatar
                src={comment.author.avatar}
                alt={comment.author.name}
                sx={{ width: 32, height: 32 }}
              >
                {comment.author.name[0]}
              </Avatar>
              <div>
                <Typography variant="subtitle2">
                  {comment.author.name}
                  {isAuthor && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      (Author)
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  <TimeAgo date={comment.createdAt} />
                  {comment.isEdited && " (edited)"}
                </Typography>
              </div>
            </div>
            
            {isAuthor && (
              <div>
                <IconButton size="small" onClick={handleMenuOpen}>
                  <MoreVert fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem 
                    onClick={() => {
                      setIsEditing(true);
                      handleMenuClose();
                    }}
                    disabled={isLoading}
                  >
                    <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
                  </MenuItem>
                  <MenuItem 
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                  </MenuItem>
                </Menu>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <CommentForm
                key="edit-form"
                initialValue={comment.content}
                onSubmit={handleUpdate}
                onCancel={() => setIsEditing(false)}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Typography>{comment.content}</Typography>
                
                {depth < maxDepth && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Button
                      startIcon={<Reply />}
                      size="small"
                      onClick={() => setIsReplying(true)}
                      disabled={isLoading}
                    >
                      Reply
                    </Button>
                    {comment.replyCount > 0 && onLoadReplies && !showReplies && (
                      <Button
                        size="small"
                        onClick={onLoadReplies}
                        disabled={isLoading}
                      >
                        Show {comment.replyCount} replies
                      </Button>
                    )}
                  </div>
                )}

                <Collapse in={isReplying}>
                  <Box sx={{ mt: 2 }}>
                    <CommentForm
                      onSubmit={handleReply}
                      onCancel={() => setIsReplying(false)}
                      placeholder="Write a reply..."
                      isLoading={isLoading}
                      error={error}
                    />
                  </Box>
                </Collapse>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <Typography 
              color="error" 
              variant="caption" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mt: 1 
              }}
            >
              <Warning fontSize="small" sx={{ mr: 0.5 }} />
              {error}
            </Typography>
          )}

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};