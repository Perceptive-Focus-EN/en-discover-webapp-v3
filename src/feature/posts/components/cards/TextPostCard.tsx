// src/features/posts/components/cards/TextPostCard.tsx
import React from 'react';
import { BaseCard } from './BaseCard';
import { TextContent, PostType } from '../../api/types';
import { BaseCardProps } from '../factory/types';
import { Box, Typography } from '@mui/material';

interface TextPostCardProps extends BaseCardProps {
  type: Extract<PostType, 'TEXT'>;
  content: TextContent;
}

export const TextPostCard: React.FC<TextPostCardProps> = ({
  content,
  ...baseProps
}) => {
  return (
    <BaseCard {...baseProps}>
      <Box
        sx={{
          p: 3,
          backgroundColor: content.backgroundColor,
          color: content.textColor,
          textAlign: content.alignment || 'left'
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: content.fontWeight || 'normal',
            fontSize: {
              small: '0.875rem',
              medium: '1rem',
              large: '1.25rem'
            }[content.fontSize || 'medium']
          }}
        >
          {content.text}
        </Typography>
        {content.caption && (
          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 2, opacity: 0.87 }}
          >
            {content.caption}
          </Typography>
        )}
      </Box>
    </BaseCard>
  );
};

