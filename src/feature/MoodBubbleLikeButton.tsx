// src/components/Feed/MoodBubbleLikeButton.tsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useMoodBoard } from '../contexts/MoodBoardContext';
import { useAuth } from '../contexts/AuthContext';
import EmotionSelectionDrawer from './EmotionSelectionDrawer';
import { EmotionId } from './types/Reaction';

interface MoodBubbleLikeButtonProps {
  postId: string;
  reactions: { emotionId: number; count: number }[];
  onReactionSelect: (emotionId: EmotionId) => void;
  useDynamicSizing?: boolean;
}

const MoodBubbleLikeButton: React.FC<MoodBubbleLikeButtonProps> = ({
  postId,
  reactions,
  onReactionSelect,
  useDynamicSizing = false,
}) => {
  const { emotions, getEmotionMappings, isLoading, error } = useMoodBoard();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();

  const handleOpenDrawer = () => setIsDrawerOpen(true);
  const handleCloseDrawer = () => setIsDrawerOpen(false);

  const handleEmotionSelect = (emotionId: EmotionId) => {
    onReactionSelect(emotionId);
    handleCloseDrawer();
  };

  useEffect(() => {
    if (user) {
      getEmotionMappings(user.userId);
    }
  }, [user, getEmotionMappings]);

  const totalReactions = reactions.reduce((sum, reaction) => sum + reaction.count, 0);

  const calculateBubbleSize = (count: number) => {
    if (!useDynamicSizing) return { xs: '20px', sm: '24px' };
    const minSize = 16;
    const maxSize = 32;
    const ratio = totalReactions > 0 ? count / totalReactions : 0;
    const size = Math.max(minSize, Math.min(maxSize, minSize + (maxSize - minSize) * ratio));
    return { xs: `${size * 0.8}px`, sm: `${size}px` };
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Button
        onClick={handleOpenDrawer}
        sx={{
          minWidth: { xs: '120px', sm: '140px' },
          height: { xs: '36px', sm: '40px' },
          padding: '6px 12px',
          backgroundColor: 'white',
          borderRadius: '24px',
          boxShadow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '8px',
          '&:hover': { backgroundColor: 'white' },
        }}
      >
        {totalReactions === 0 ? (
          <>
            <Box
              sx={{
                width: { xs: '20px', sm: '24px' },
                height: { xs: '20px', sm: '24px' },
                flexShrink: 0,
                backgroundColor: 'white',
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AddIcon sx={{ fontSize: { xs: '14px', sm: '16px' }, color: 'primary.main' }} />
            </Box>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '11px', sm: '12px' },
                fontFamily: 'Nunito, sans-serif',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexGrow: 1,
                textAlign: 'left',
              }}
            >
              Give first reaction
            </Typography>
          </>
        ) : (
          reactions.map((reaction, index) => {
            const bubbleSize = calculateBubbleSize(reaction.count);
            const emotion = emotions.find(e => e.id === reaction.emotionId);
            return (
              <Box
                key={reaction.emotionId}
                sx={{
                  width: bubbleSize,
                  height: bubbleSize,
                  borderRadius: '50%',
                  backgroundColor: emotion?.color || '#ccc',
                  marginLeft: index !== 0 ? '-8px' : '0',
                  zIndex: reactions.length - index,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                }}
              >
                {reaction.count}
              </Box>
            );
          })
        )}
      </Button>
      <EmotionSelectionDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onOpen={handleOpenDrawer}
        onEmotionSelect={handleEmotionSelect}
        emotions={emotions}
        isLoading={isLoading}
        error={error}
      />
    </Box>
  );
};

export default MoodBubbleLikeButton;