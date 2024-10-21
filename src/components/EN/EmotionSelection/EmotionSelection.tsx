import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  Button,
} from '@mui/material';
import EmotionBall from './EmotionBall';
import EmotionBubble from './EmotionBubble';
import { ColorPalette, ValidHexColor } from '../types/colorPalette';
import { useAuth } from '../../../contexts/AuthContext';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';
import { ReactionType, EmotionName, EmotionId } from '../../Feed/types/Reaction';
import { Emotion } from '../types/emotions';
import { emotionMappingsApi } from '../../../lib/api_s/reactions/emotionMappings';

type ColorType = ValidHexColor | ValidHexColor[];

interface EmotionSelectionProps {
  colorPalette: ColorPalette;
  paletteVersion: number;
  onComplete: (selectedEmotions: Emotion[]) => void;
  initialEmotions?: Emotion[];
}

function colorKey(color: ColorType): ColorType {
  return Array.isArray(color) ? (color.join('-') as ValidHexColor) : color;
}

const EmotionSelection: React.FC<EmotionSelectionProps> = ({
  colorPalette,
  paletteVersion,
  onComplete,
  initialEmotions = [],
}) => {
  const { user } = useAuth();
  const [emotions, setEmotions] = useState<Emotion[]>(() => {
    if (initialEmotions.length > 0) {
      return initialEmotions;
    } else {
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    emotionMappingsApi.getEmotionMappings(user.userId).then((reactions: { id: EmotionId; emotionName: EmotionName }[]) => {
      const mappedEmotions = reactions.map((reaction) => ({
        id: reaction.id,
        emotionName: reaction.emotionName,
        userId: user.userId, // Include userId
        color: '',
        volume: 0, // Default volume value
        sources: [] // Default sources value
      }));
      setEmotions(mappedEmotions);
    }).catch((err) => {
      setError('Failed to fetch emotion mappings');
      frontendLogger.error('Failed to fetch emotion mappings', 'An error occurred while fetching emotion mappings', { error: err });
    });
  }, [user]);
  const [availableBubbles, setAvailableBubbles] = useState<Record<string, ColorType>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [currentPaletteVersion, setCurrentPaletteVersion] = useState<number>(paletteVersion);

  useEffect(() => {
    if (colorPalette && colorPalette.colors) {
      setAvailableBubbles(
        colorPalette.colors.reduce((acc, color) => {
          acc[String(colorKey(color))] = color;
          return acc;
        }, {} as Record<string, ColorType>)
      );
    }
  }, [colorPalette]);

  useEffect(() => {
    if (paletteVersion !== currentPaletteVersion) {
      if (colorPalette && colorPalette.colors) {
        setAvailableBubbles(
          colorPalette.colors.reduce((acc, color) => {
            acc[String(colorKey(color))] = color;
            return acc;
          }, {} as Record<string, ColorType>)
        );
      }
      setCurrentPaletteVersion(paletteVersion);
      setEmotions((prevEmotions) =>
        prevEmotions.map((emotion) => ({ ...emotion, color: '' }))
      );
    }
  }, [paletteVersion, colorPalette, currentPaletteVersion]);


  // Removed duplicate handleRemove function
  interface AvailableBubbles {
    [key: string]: ColorType;
  }

  interface EmotionState {
    id: EmotionId;
    emotionName: EmotionName;
    color: string | undefined;
    volume: number;
    sources: string[];
  }

  const handleDrop: (
    emotionId: EmotionId,
    bubbleId: string,
    newColor: ColorType
  ) => void = (emotionId, bubbleId, newColor) => {
    setEmotions((prevEmotions) => {
      const updatedEmotions = prevEmotions.map((emotion) => {
        if (String(emotion.id) === String(emotionId)) {
          return { ...emotion, color: String(colorKey(newColor)) };
        }
        return { ...emotion, color: String(emotion.color || '') }; // Ensure color is included
      });
      setAvailableBubbles((prevBubbles) => {
        const newBubbles = { ...prevBubbles };
        delete newBubbles[bubbleId];
        const oldEmotion = prevEmotions.find((e) => String(e.id) === String(emotionId));
        if (
          oldEmotion &&
          oldEmotion.color &&
          colorKey(oldEmotion.color as ColorType) !== colorKey(newColor)
        ) {
          newBubbles[String(colorKey(oldEmotion.color as ColorType))] = oldEmotion.color as ColorType;
        }
        return newBubbles;
      });
      return updatedEmotions;
    });
  };

  const handleRemove: (emotionId: EmotionId) => void = (emotionId) => {
    setEmotions((prevEmotions) => {
      const updatedEmotions = prevEmotions.map((emotion) => {
        if (String(emotion.id) === String(emotionId)) {
          return { ...emotion, color: '' };
        }
        return emotion;
      });
      return updatedEmotions;
    });
  };
  const handleSubmit = async () => {
  if (!user) {
    setError('User not authenticated');
    return;
  }
  try {
    setLoading(true);
    const emotionsToSave = emotions.filter(emotion => emotion.color);
    await emotionMappingsApi.saveEmotionMappings(user.userId, emotionsToSave);
    frontendLogger.info('Emotion mappings saved successfully', 'Your emotion mappings have been saved.');
    onComplete(emotionsToSave);
  } catch (err) {
    frontendLogger.error('Failed to save emotion mappings', 'An error occurred while saving emotion mappings', { error: err });
    setError('Failed to save your selections. Please try again.');
  } finally {
    setLoading(false);
  }
  };

  if (loading) return <CircularProgress />;

   return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
          gap: theme.spacing(3),
          '& > div': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 80px))',
            gap: theme.spacing(3),
            justifyContent: 'center',
          },
        }}
      >
        <Box>
          {emotions.map((emotion) => (
            <EmotionBall
              key={String(emotion.id)}
              emotion={emotion}
              onDrop={handleDrop}
              onRemove={handleRemove}
            />
          ))}
        </Box>
        <Box>
          {Object.entries(availableBubbles).map(([key, color]) => (
            <EmotionBubble key={key} id={key} color={color} />
          ))}
        </Box>
      </Box>
      <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mt: 3 }}>
        Save and Continue
      </Button>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="warning" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      {isOffline && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You are currently offline. Changes will be saved when connection is restored.
        </Alert>
      )}
    </>
  );
};

export default EmotionSelection;
