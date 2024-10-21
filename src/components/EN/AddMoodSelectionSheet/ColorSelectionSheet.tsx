// src/components/EN/AddMoodSelectionSheet/ColorSelectionSheet.tsx
import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import ColorBubble from './ColorBubble';
import { Emotion } from '../types/emotions';
import { vibrantPalette } from '../types/colorPalette';

interface ColorSelectionSheetProps {
  onColorSelect: (emotion: Emotion, color: string) => void;
  selectedEmotions: Emotion[];
}

const ColorSelectionSheet: React.FC<ColorSelectionSheetProps> = ({ onColorSelect, selectedEmotions }) => {
  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      bgcolor: 'background.paper',
      padding: 3,
    }}>
      <Typography variant="h4" gutterBottom align="center">
        Your Emotion Color Map
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        {selectedEmotions.map((emotion) => (
          <Grid item key={emotion.id}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom>
                {emotion.emotionName}
              </Typography>
              <ColorBubble
                color={
                  vibrantPalette.colors[
                    Math.floor(Math.random() * vibrantPalette.colors.length)
                  ] as string
                }
                onClick={function () {
                  onColorSelect(emotion, vibrantPalette.colors[Math.floor(Math.random() * vibrantPalette.colors.length)] as string);
                }
                }
              >
                {emotion.emotionName}
              </ColorBubble>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ColorSelectionSheet;