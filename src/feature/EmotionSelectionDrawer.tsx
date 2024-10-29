import React from 'react';
import { SwipeableDrawer, Container, Box, Typography, IconButton, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { EmotionId, EmotionName } from './types/Reaction';
import { parseToRgba, darken, lighten, rgba } from 'color2k';

// Updated interface to match the mapped emotions from MoodBubbleLikeButton
interface EmotionWithColor {
  id: EmotionId;
  emotionName: EmotionName;
  color?: string;
}

interface EmotionSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onEmotionSelect: (emotionId: EmotionId) => void;
  emotions: EmotionWithColor[]; // Updated type
  isLoading: boolean;
  error: string | null;
}

const EmotionSelectionDrawer: React.FC<EmotionSelectionDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  onEmotionSelect,
  emotions,
  isLoading,
  error,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getEmotionGradient = (color: string) => {
    const [r, g, b, a] = parseToRgba(color);
    const lightColor = lighten(rgba(r, g, b, a), 0.1);
    const darkColor = darken(rgba(r, g, b, a), 0.1);
    return `linear-gradient(135deg, ${lightColor}, ${darkColor})`;
  };

  const getShadowColor = (color: string) => {
    const [r, g, b] = parseToRgba(color);
    return rgba(r, g, b, 0.3);
  };

  const handleEmotionClick = (emotionId: EmotionId) => {
    onEmotionSelect(emotionId);
    onClose();
  };

  // Rest of the component remains exactly the same
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '80vh',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontSize: { xs: '18px', sm: '20px' } }}>Choose an Emotion</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ fontSize: { xs: '12px', sm: '14px' } }}>{error}</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '70px' : '80px'}, 1fr))`,
              gap: { xs: 1, sm: 2 },
              justifyContent: 'center',
            }}
          >
            {emotions.map((emotion) => (
              <Box 
                key={emotion.id}
                sx={{ 
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 },
                }}
                onClick={() => handleEmotionClick(emotion.id)}
              >
                <Box
                  sx={{
                    width: { xs: '50px', sm: '60px' },
                    height: { xs: '50px', sm: '60px' },
                    borderRadius: '50%',
                    background: getEmotionGradient(emotion.color || '#CCCCCC'),
                    margin: '0 auto',
                    boxShadow: `0 4px 8px ${getShadowColor(emotion.color || '#CCCCCC')}`,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                />
                <Typography 
                  variant="caption" 
                  align="center" 
                  sx={{ 
                    fontSize: { xs: '10px', sm: '12px' },
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