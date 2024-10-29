// src/features/posts/components/cards/MoodPostCard.tsx
import React from 'react';
import { BaseCard } from './BaseCard';
import { MoodContent, PostType } from '../../api/types';
import { BaseCardProps } from '../factory/types';
import { Box, Typography } from '@mui/material';

interface MoodPostCardProps extends BaseCardProps {
  type: Extract<PostType, 'MOOD'>;
  content: MoodContent;
}

export const MoodPostCard: React.FC<MoodPostCardProps> = ({
  content,
  ...baseProps
}) => {
  return (
    <BaseCard {...baseProps}>
      <Box
        sx={{
          p: 3,
          backgroundColor: content.color,
          borderRadius: 1,
          textAlign: content.alignment || 'center'
        }}
      >
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: content.fontWeight || 'bold',
            fontSize: {
              small: '1rem',
              medium: '1.25rem',
              large: '1.5rem'
            }[content.fontSize || 'medium']
          }}
        >
          {content.mood}
        </Typography>
        {content.caption && (
          <Typography
            variant="body1"
            sx={{
              mt: 2,
              opacity: 0.87
            }}
          >
            {content.caption}
          </Typography>
        )}
      </Box>
    </BaseCard>
  );
};