import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Button,
} from '@mui/material';
import EmotionBall from './EmotionBall';
import EmotionBubble from './EmotionBubble';
import { ColorPalette, ValidHexColor } from '../types/colorPalette';
import { useAuth } from '../../../contexts/AuthContext';
import { ReactionType, EmotionName, EmotionId } from '../../../feature/types/Reaction';
import { Emotion } from '../types/emotions';
import { emotionMappingsApi } from '../../../lib/api_s/reactions/emotionMappings';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
// Define MappedEmotion type if it doesn't exist in the module
interface MappedEmotion {
  id: EmotionId;
  emotionName: EmotionName;
  userId: string;
  color: string;
  volume: number;
  sources: any[];
}

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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [emotions, setEmotions] = useState<Emotion[]>(initialEmotions);
  const [availableBubbles, setAvailableBubbles] = useState<Record<string, ColorType>>({});
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [currentPaletteVersion, setCurrentPaletteVersion] = useState<number>(paletteVersion);

  // Load emotion mappings
  useEffect(() => {
    if (!user) return;

    const loadEmotions = async () => {
      setLoading(true);
      const reactions = await emotionMappingsApi.getEmotionMappings(user.userId);

      const mappedEmotions: MappedEmotion[] = reactions.map((reaction: { id: any; emotionName: any; }): MappedEmotion => ({
        id: reaction.id,
        emotionName: reaction.emotionName,
        userId: user.userId,
        color: '',
        volume: 0,
        sources: []
      }));
      setEmotions(mappedEmotions);
      setLoading(false);
    };

    loadEmotions();
  }, [user]);

  // Handle color palette
  useEffect(() => {
    if (colorPalette?.colors) {
      setAvailableBubbles(
        colorPalette.colors.reduce((acc, color) => {
          acc[String(colorKey(color))] = color;
          return acc;
        }, {} as Record<string, ColorType>)
      );
    }
  }, [colorPalette]);

  // Handle palette version changes
  useEffect(() => {
    if (paletteVersion !== currentPaletteVersion) {
      if (colorPalette?.colors) {
        setAvailableBubbles(
          colorPalette.colors.reduce((acc, color) => {
            acc[String(colorKey(color))] = color;
            return acc;
          }, {} as Record<string, ColorType>)
        );
      }
      setCurrentPaletteVersion(paletteVersion);
      setEmotions(prevEmotions => prevEmotions.map(emotion => ({ ...emotion, color: '' })));
    }
  }, [paletteVersion, colorPalette, currentPaletteVersion]);

  const handleDrop = (emotionId: EmotionId, bubbleId: string, newColor: ColorType) => {
    setEmotions(prevEmotions => {
      const updatedEmotions = prevEmotions.map(emotion => {
        if (String(emotion.id) === String(emotionId)) {
          return { ...emotion, color: String(colorKey(newColor)) };
        }
        return { ...emotion, color: String(emotion.color || '') };
      });

      setAvailableBubbles(prevBubbles => {
        const newBubbles = { ...prevBubbles };
        delete newBubbles[bubbleId];
        const oldEmotion = prevEmotions.find(e => String(e.id) === String(emotionId));
        if (oldEmotion?.color && colorKey(oldEmotion.color as ColorType) !== colorKey(newColor)) {
          newBubbles[String(colorKey(oldEmotion.color as ColorType))] = oldEmotion.color as ColorType;
        }
        return newBubbles;
      });

      return updatedEmotions;
    });
  };

  const handleRemove = (emotionId: EmotionId) => {
    setEmotions(prevEmotions => 
      prevEmotions.map(emotion => 
        String(emotion.id) === String(emotionId) 
          ? { ...emotion, color: '' } 
          : emotion
      )
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    const emotionsToSave = emotions.filter(emotion => emotion.color);
    
    await emotionMappingsApi.saveEmotionMappings(user.userId, emotionsToSave);
    messageHandler.success('Emotions saved successfully');
    onComplete(emotionsToSave);
    
    setLoading(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

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
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSubmit} 
        sx={{ mt: 3 }}
        disabled={loading}
      >
        Save and Continue
      </Button>
      {isOffline && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You are currently offline. Changes will be saved when connection is restored.
        </Alert>
      )}
    </>
  );
};

export default EmotionSelection;