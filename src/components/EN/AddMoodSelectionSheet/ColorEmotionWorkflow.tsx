// src/components/EN/AddMoodSelectionSheet/ColorEmotionWorkflow.tsx
import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import ColorSelectionSheet from './ColorSelectionSheet';
import EmotionalVolumeSelection from './EmotionalVolumeSelection';
import { Emotion } from '../types/emotions';

interface ColorEmotionWorkflowProps {
  selectedEmotions: Emotion[];
  onComplete: (selections: Array<{ emotion: Emotion; color: string; volume: number }>) => void;
}

const ColorEmotionWorkflow: React.FC<ColorEmotionWorkflowProps> = ({ selectedEmotions, onComplete }) => {
  const [step, setStep] = useState<'color' | 'volume'>('color');
  const [colorSelections, setColorSelections] = useState<Array<{ emotion: Emotion; color: string }>>(
    selectedEmotions.map(emotion => ({ emotion, color: emotion.color || '' }))
  );
  const [volumeSelections, setVolumeSelections] = useState<Array<{ emotion: Emotion; volume: number }>>([]);

  const handleColorSelect = (emotion: Emotion, color: string) => {
    setColorSelections(prev => prev.map(s => s.emotion.id === emotion.id ? { ...s, color } : s));
    if (colorSelections.every(s => s.color)) {
      setStep('volume');
    }
  };

  const handleVolumeSelect = (emotion: Emotion, volume: number) => {
    setVolumeSelections(prev => [...prev.filter(s => s.emotion.id !== emotion.id), { emotion, volume }]);
  };

  const handleComplete = () => {
    if (volumeSelections.length === selectedEmotions.length) {
      const finalSelections = selectedEmotions.map(emotion => ({
        emotion,
        color: colorSelections.find(s => s.emotion.id === emotion.id)!.color,
        volume: volumeSelections.find(s => s.emotion.id === emotion.id)!.volume
      }));
      onComplete(finalSelections);
    }
  };

  return (
    <Box>
      {step === 'color' && (
        <ColorSelectionSheet 
          selectedEmotions={selectedEmotions} 
          onColorSelect={handleColorSelect}
        />
      )}
      {step === 'volume' && (
        <>
          <EmotionalVolumeSelection 
                      colorSelections={colorSelections}
                      onVolumeSelect={handleVolumeSelect}
                      selectedColor={colorSelections.find(s => !s.color)!.color}
                  />
          <Button 
            onClick={handleComplete} 
            disabled={volumeSelections.length !== selectedEmotions.length}
          >
            Complete Selection
          </Button>
        </>
      )}
    </Box>
  );
};

export default ColorEmotionWorkflow;