// src/components/Feed/EmotionBubble.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Emotion } from '../components/EN/types/emotions';

interface EmotionBubbleProps {
  emotion: Emotion;
  isActive: boolean;
  onToggle: () => void;
}

const EmotionBubble: React.FC<EmotionBubbleProps> = ({ emotion, isActive, onToggle }) => {
  return (
    <Box
      onClick={onToggle}
      sx={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: emotion.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: isActive ? 1 : 0.5,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.1)',
        },
      }}
    >
      <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
        {emotion.emotionName.slice(0, 3)}
      </Typography>
    </Box>
  );
};

export default EmotionBubble;