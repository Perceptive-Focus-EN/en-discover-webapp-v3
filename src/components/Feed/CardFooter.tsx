// src/components/Feed/CardFooter.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import MoodBubbleLikeButton from './MoodBubbleLikeButton';
import { EmotionId } from './types/Reaction';
import { UserAccountTypeEnum } from '../../constants/AccessKey/accounts';

interface CardFooterProps {
  postId: string;
  reactions: { emotionId: number; count: number }[];
  userTypeBadge: React.ReactNode;
  onReactionSelect: (postId: string, emotionId: EmotionId) => void;
}

export const CardFooter: React.FC<CardFooterProps> = ({ 
  postId, 
  reactions, 
  userTypeBadge, 
  onReactionSelect 
}) => {
  const handleReactionSelect = (emotionId: EmotionId) => {
    onReactionSelect(postId, emotionId);
  };

  const totalReactions = reactions.reduce((sum, reaction) => sum + reaction.count, 0);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      p: 2,
      borderTop: 1,
      borderColor: 'divider'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <MoodBubbleLikeButton
          postId={postId}
          reactions={reactions}
          onReactionSelect={handleReactionSelect}
          useDynamicSizing={true} // Set to true for development, false for production
        />
        <Typography variant="caption" color="text.secondary">
          {totalReactions} reaction(s)
        </Typography>
      </Box>
      {userTypeBadge}
    </Box>
  );
};