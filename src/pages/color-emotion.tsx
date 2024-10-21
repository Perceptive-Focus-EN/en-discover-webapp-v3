// src/pages/color-emotion.tsx
import React from 'react';
import { Box } from '@mui/material';
import ColorSelectionSheet from '../components/EN/AddMoodSelectionSheet/ColorSelectionSheet';
import { Emotion } from '../components/EN/types/emotions';

const ColorEmotionPage: React.FC = () => {
  const handleColorSelect = (emotion: Emotion, color: string) => {
    console.log(`Selected ${color} for ${emotion.emotionName}`);
    // Here you would typically update state or send data to a backend
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <ColorSelectionSheet onColorSelect={handleColorSelect}
              selectedEmotions={[]} />
    </Box>
  );
};

export default ColorEmotionPage;