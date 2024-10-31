// src/features/posts/components/factory/PostCardFactory.tsx

import React, { useState, useCallback } from 'react';
import { MoodContent, PhotoContent, Post, PostType, SurveyContent, TextContent, VideoContent } from '../../api/types';
import { TextPostCard } from '../cards/TextPostCard';
import { PhotoPostCard } from '../cards/PhotoPostCard';
import { VideoPostCard } from '../cards/VideoPostCard';
import { MoodPostCard } from '../cards/MoodPostCard';
import { SurveyPostCard } from '../cards/SurveyPostCard';
import MoodBubbleLikeButton from '../../../MoodBubbleLikeButton';
import { Badge, Button, Collapse, Divider, IconButton, Paper, Tooltip } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { motion } from 'framer-motion';
import CommentIcon from '@mui/icons-material/Comment';
import { CommentList } from '../../Comments/CommentList';
import { BookmarkIcon } from 'lucide-react';
import { ShareButton } from '../Share/ShareMenu';
import { useTheme } from '@mui/material/styles';
import { reactionApi } from '../../api/reactionApi';
import { messageHandler } from '../../../../MonitoringSystem/managers/FrontendMessageHandler';
import { EmotionId, PostReaction, ReactionSummary, ReactionMetrics } from '@/feature/types/Reaction';

interface PostCardFactoryProps {
  post: Post;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onShare?: (platform: string) => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export const PostCardFactory: React.FC<PostCardFactoryProps> = ({ 
  post, 
  onDelete, 
  onEdit,
  onShare,
  onBookmark,
  isBookmarked = false
}) => {
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const theme = useTheme();

  // Handle reaction change
  const handleReactionChange = useCallback(async () => {
    try {
      const [updatedSummary, updatedMetrics] = await Promise.all([
        reactionApi.getSummary(post.id),
        reactionApi.getMetrics(post.id)
      ]);

      setLocalPost(prev => ({
        ...prev,
        reactions: updatedSummary as unknown as PostReaction[],
        metrics: updatedMetrics
      }));
    } catch (err) {
      console.error('Failed to update post reactions:', err);
      messageHandler.error('Failed to update reactions');
    }
  }, [post.id]);

  const baseProps = {
    id: localPost.id,
    authorId: localPost.authorId,
    username: localPost.username,
    userAvatar: localPost.userAvatar,
    createdAt: localPost.createdAt,
    updatedAt: localPost.updatedAt,
    visibility: localPost.visibility,
    onDelete,
    onEdit
  };

  const renderPostCard = () => {
    switch (post.type) {
      case 'TEXT':
        return <TextPostCard {...baseProps} type="TEXT" content={localPost.content as TextContent} />;
      case 'PHOTO':
        return <PhotoPostCard {...baseProps} type="PHOTO" content={localPost.content as PhotoContent} media={localPost.media} />;
      case 'VIDEO':
        return <VideoPostCard {...baseProps} type="VIDEO" content={localPost.content as VideoContent} media={localPost.media} />;
      case 'MOOD':
        return <MoodPostCard {...baseProps} type="MOOD" content={localPost.content as MoodContent} />;
      case 'SURVEY':
        return <SurveyPostCard {...baseProps} type="SURVEY" content={localPost.content as SurveyContent} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative"
    >
      <Paper
        elevation={2}
        className="overflow-hidden transition-shadow hover:shadow-md"
        sx={{
          borderRadius: 2,
          bgcolor: 'background.paper',
          '&:hover': {
            bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          },
        }}
      >
        {/* Post Content */}
        {renderPostCard()}

        {/* Engagement Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            {/* Replace ReactionBar with MoodBubbleLikeButton */}
            <MoodBubbleLikeButton
              postId={localPost.id}
              postReactions={localPost.reactions as PostReaction[]}
              reactionMetrics={localPost.reactionMetrics as unknown as ReactionMetrics}
              onReactionSelect={handleReactionChange}
              useDynamicSizing={true}
            />

            <div className="flex items-center space-x-2">
              <ShareButton post={localPost} />

              <Tooltip title={isBookmarked ? "Remove Bookmark" : "Bookmark"}>
                <IconButton 
                  size="small" 
                  onClick={onBookmark}
                  color={isBookmarked ? "primary" : "default"}
                >
                  {isBookmarked ? (
                    <BookmarkIcon fontSize="small" />
                  ) : (
                    <BookmarkBorderIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <Divider sx={{ my: 1 }} />

          <div className="flex items-center justify-between">
            <Button
              size="small"
              startIcon={
                <Badge 
                  badgeContent={localPost.commentCount} 
                  color="primary"
                  max={99}
                >
                  <CommentIcon />
                </Badge>
              }
              onClick={() => setShowComments(!showComments)}
              sx={{ textTransform: 'none', '&:hover': { backgroundColor: 'action.hover' } }}
            >
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </Button>
          </div>

          {/* Comments Section with Animation */}
          <Collapse in={showComments}>
            <div className="mt-3">
              <CommentList postId={localPost.id} />
            </div>
          </Collapse>
        </div>
      </Paper>
    </motion.div>
  );
};

// ErrorBoundary Wrapper for PostCardFactory
export const PostCard: React.FC<PostCardFactoryProps> = (props) => (
  <ErrorBoundary
    fallback={
      <Paper elevation={1} className="p-4 text-red-500 text-center">
        Failed to load post
      </Paper>
    }
  >
    <PostCardFactory {...props} />
  </ErrorBoundary>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
