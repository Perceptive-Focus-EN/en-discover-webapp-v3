// src/components/Feed/EmotionFilterDrawer.tsx

import React from 'react';
import { Box, Typography, IconButton, useMediaQuery, Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Emotion } from '../EN/types/emotions';
import EmotionBubble from './EmotionBubble';

interface EmotionFilterDrawerProps {
    emotions: Emotion[];
    activeEmotions: number[];
    onEmotionToggle: (emotionId: number) => void;
    onClose: () => void;
}

const EmotionFilterDrawer: React.FC<EmotionFilterDrawerProps> = ({
    emotions,
    activeEmotions,
    onEmotionToggle,
    onClose,
}) => {
    const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    return (
        <Box sx={{ p: 2, width: isSmallScreen ? '100%' : '400px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Filter by Emotion</Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={1}>
                {emotions.map(emotion => (
                    <EmotionBubble
                        key={emotion.id}
                        emotion={emotion}
                        isActive={activeEmotions.includes(emotion.id)}
                        onToggle={() => onEmotionToggle(emotion.id)}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default EmotionFilterDrawer;