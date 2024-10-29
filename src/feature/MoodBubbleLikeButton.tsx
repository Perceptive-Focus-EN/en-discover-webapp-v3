import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '@/contexts/AuthContext';
import EmotionSelectionDrawer from './EmotionSelectionDrawer';
import { EmotionId, Reaction } from '@/feature/types/Reaction';
import { useReactions } from '@/feature/posts/hooks/useReactions';

interface MoodBubbleLikeButtonProps {
  postId: string;
  useDynamicSizing?: boolean;
  reactions: Reaction[];
  onEmotionSelect: (reaction: Reaction) => void;
}

const MoodBubbleLikeButton: React.FC<MoodBubbleLikeButtonProps> = ({
  postId,
  useDynamicSizing = false,
  reactions,
  onEmotionSelect
}) => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const {
    reactions: formattedReactions,
    toggleReaction,
    isLoading,
    emotionTypes,
    canReact
  } = useReactions(postId);

  const handleOpenDrawer = () => {
    if (!user) {
      // You might want to show a login prompt here
      return;
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => setIsDrawerOpen(false);

  const handleEmotionSelect = async (emotionId: EmotionId) => {
    await toggleReaction(emotionId);
    handleCloseDrawer();
  };


  const totalReactions = formattedReactions.reduce((sum, reaction) => sum + reaction.count, 0);

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
        disabled={isLoading || !canReact}
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
          '&.Mui-disabled': {
            backgroundColor: 'white',
            opacity: 0.7
          }
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
              {canReact ? 'Give first reaction' : 'Login to react'}
            </Typography>
          </>
        ) : (
          formattedReactions.map((reaction, index) => {
            const bubbleSize = calculateBubbleSize(reaction.count);
            const emotionType = emotionTypes.find(e => e.id === reaction.emotionId);
            return (
              <Box
                key={reaction.emotionId}
                sx={{
                  width: bubbleSize,
                  height: bubbleSize,
                  borderRadius: '50%',
                  backgroundColor: reaction.color || '#ccc',
                  marginLeft: index !== 0 ? '-8px' : '0',
                  zIndex: formattedReactions.length - index,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  cursor: canReact ? 'pointer' : 'default',
                  border: `2px solid ${reaction.color || '#ccc'}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': canReact ? {
                    transform: 'scale(1.1)',
                    zIndex: formattedReactions.length + 1
                  } : {}
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
        emotions={emotionTypes.map(emotion => ({
          ...emotion,
          color: formattedReactions.find(r => r.emotionId === emotion.id)?.color || '#ccc'
        }))}
        isLoading={isLoading}
        error={null}
      />
    </Box>
  );
};

export default MoodBubbleLikeButton;