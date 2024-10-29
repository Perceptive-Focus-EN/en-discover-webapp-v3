// src/features/posts/components/Comments/CommentItem.tsx
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Button 
} from '@mui/material';
import { Edit, Delete, Reply } from '@mui/icons-material';
import { Comment } from '../api/commentApi';
import { CommentForm } from './CommentForm';
import TimeAgo from 'react-timeago';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply: (content: string, parentId: string) => Promise<void>;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onUpdate,
  onDelete,
  onReply
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const handleUpdate = async (content: string) => {
    await onUpdate(comment.id, content);
    setIsEditing(false);
  };

  const handleReply = async (content: string) => {
    await onReply(content, comment.id);
    setIsReplying(false);
  };

  return (
    <Card variant="outlined" className="mb-2">
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {comment.author.avatar && (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <Typography variant="subtitle2">{comment.author.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              <TimeAgo date={comment.createdAt} />
              {comment.isEdited && " (edited)"}
            </Typography>
          </div>
          
          <div>
            <IconButton size="small" onClick={() => setIsEditing(true)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onDelete(comment.id)}>
              <Delete fontSize="small" />
            </IconButton>
          </div>
        </div>

        {isEditing ? (
          <CommentForm
            initialValue={comment.content}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <Typography>{comment.content}</Typography>
            
            <div className="mt-2 flex items-center space-x-2">
              <Button
                startIcon={<Reply />}
                size="small"
                onClick={() => setIsReplying(true)}
              >
                Reply
              </Button>
              {comment.replyCount > 0 && (
                <Typography variant="caption">
                  {comment.replyCount} replies
                </Typography>
              )}
            </div>

            {isReplying && (
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
