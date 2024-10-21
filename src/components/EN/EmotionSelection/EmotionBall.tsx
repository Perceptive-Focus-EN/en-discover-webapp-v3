// src/components/EN/EmotionSelection/EmotionBall.tsx

import React, { useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Typography, Paper, useTheme } from '@mui/material';
import { ValidHexColor } from '../types/colorPalette';
import { createGradient } from '../../../utils/colorUtils';
import { EmotionId, EmotionName } from '../../Feed/types/Reaction';
import { Emotion } from '../types/emotions';

type ColorType = ValidHexColor | ValidHexColor[];

interface EmotionBallProps {
  emotion: Emotion;
  onDrop: (emotionId: EmotionId, bubbleId: string, color: ColorType) => void;
  onRemove: (emotionId: EmotionId) => void;
}

interface DraggedItem {
  id: string;
  color: ColorType;
}

const EmotionBall: React.FC<EmotionBallProps> = ({ emotion, onDrop, onRemove }) => {
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio('/bubble_pop.mp3');
  }, []);

 const [{ isOver }, drop] = useDrop({
     accept: 'emotionBubble',
     drop: (item: DraggedItem) => {
       onDrop(emotion.id, item.id, item.color);
       if (audioRef.current) {
         audioRef.current.play();
       }
     },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (paperRef.current) {
      drop(paperRef.current);
    }
  }, [drop]);

    const handleClick = () => {
    if (emotion.color) {
      onRemove(emotion.id);
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  };

  const getBackgroundColor = () => {
    if (emotion.color) {
      if (Array.isArray(emotion.color)) {
        return createGradient(emotion.color as ValidHexColor[]);
      } else {
        return emotion.color;
      }
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (!emotion.color) return '#9CA3AF';

    let colorToUse: string;

    if (Array.isArray(emotion.color)) {
      colorToUse = emotion.color[0];
    } else {
      colorToUse = emotion.color;
    }

    const rgb = hexToRgb(colorToUse);
    if (!rgb) return '#000000';
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    if (brightness > 240) {
      return '#4A5568';
    } else if (brightness > 180) {
      return '#2D3748';
    } else {
      return '#FFFFFF';
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();
  const borderColor = emotion.color ? 'none' : '1px solid #E5E7EB';

  return (
    <Paper
      ref={paperRef}
      elevation={emotion.color ? 3 : 0}
      onClick={handleClick}
      sx={{
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: backgroundColor,
        cursor: emotion.color ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: borderColor,
      }}
    >
      <Typography
        variant="body2"
        noWrap
        sx={{
          color: textColor,
          fontWeight: 'bold',
          textAlign: 'center',
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem',
        }}
      >
        {emotion.emotionName}
      </Typography>
    </Paper>
  );
};

export default EmotionBall;