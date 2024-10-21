import React, { useState } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { Emotion } from '../types/emotions';

interface EmotionalVolumeSelectionProps {
  selectedColor: string;
  colorSelections: Array<{ emotion: Emotion; color: string }>;
  onVolumeSelect: (emotion: Emotion, volume: number) => void;
}


const EmotionalVolumeSelection: React.FC<EmotionalVolumeSelectionProps> = ({ selectedColor, colorSelections, onVolumeSelect }) => {
  const [volume, setVolume] = useState<number>(50);

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    const selectedEmotion = colorSelections.find(selection => selection.color === selectedColor)?.emotion;
    if (selectedEmotion) {
      onVolumeSelect(selectedEmotion, newValue as number);
    }
  };

  return (
    <Box>
      <Typography variant="h5">Set Emotional Volume for {selectedColor}</Typography>
      <Slider
        value={volume}
        onChange={handleVolumeChange}
        aria-labelledby="emotional-volume-slider"
        valueLabelDisplay="auto"
        step={10}
        marks
        min={0}
        max={100}
      />
    </Box>
  );
};

export default EmotionalVolumeSelection;