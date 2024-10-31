// src/feature/EmotionSelectionDrawer.tsx
import React from 'react';
import { SwipeableDrawer, Container, Box, Typography, IconButton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Emotion } from '../components/EN/types/emotions';
import { EmotionId } from './types/Reaction';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface EmotionSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmotionSelect: (emotionId: EmotionId) => Promise<void>;
  emotions: Emotion[];
  isLoading: boolean;
  error: string | null;
}

const EmotionSelectionDrawer: React.FC<EmotionSelectionDrawerProps> = ({
  isOpen,
  onClose,
  onEmotionSelect,
  emotions,
  isLoading,
  error
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleEmotionClick = async (emotionId: EmotionId) => {
    try {
      await onEmotionSelect(emotionId);
      messageHandler.success('Reaction added');
      onClose();
    } catch (error) {
      messageHandler.error('Failed to add reaction');
    }
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      onOpen={() => {}}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '80vh',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Choose an Emotion</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '70px' : '80px'}, 1fr))`,
              gap: { xs: 1, sm: 2 },
              justifyContent: 'center',
            }}
          >
            {emotions.map(emotion => (
              <Box
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id as EmotionId)}
                sx={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: '50px', sm: '60px' },
                    height: { xs: '50px', sm: '60px' },
                    borderRadius: '50%',
                    backgroundColor: emotion.color,
                    margin: '0 auto',
                    boxShadow: theme.shadows[3],
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {emotion.emotionName}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </SwipeableDrawer>
  );
};

export default EmotionSelectionDrawer;