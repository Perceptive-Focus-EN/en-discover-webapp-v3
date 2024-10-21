// EmotionVolumeView.tsx
import React, { useState } from 'react';
import { Box, Typography, Slider, Button, Chip } from '@mui/material';

interface EmotionVolumeViewProps {
  color: string;
  onComplete: (volume: number, sources: string[]) => void;
}

const EmotionVolumeView: React.FC<EmotionVolumeViewProps> = ({ color, onComplete }) => {
  const [volume, setVolume] = useState<number>(50);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const sources = ['Everything', 'Family', 'Friends', 'Relations', 'Work', 'Life'];
  const volumes = ['A little', 'Normal', 'Enough', 'A lot'];

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
  };

  const handleSourceToggle = (sources: string) => {
    setSelectedSources(prev => 
      prev.includes(sources) 
        ? prev.filter(r => r !== sources)
        : [...prev, sources]
    );
  };

  const handleComplete = () => {
    onComplete(volume, selectedSources);
  };

  const [lightColor, darkColor] = color.split(', ');

  return (
    <Box sx={{
      bgcolor: `${lightColor}`,
      backgroundImage: `linear-gradient(to bottom, ${lightColor}, ${darkColor})`,
      borderRadius: '24px 24px 0 0',
      padding: 4,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'white',
    }}>
      <Typography variant="h5" gutterBottom>
        What is your emotional volume?
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        Select one or several sources feeling like that, and the volume of this mood
      </Typography>
      <Slider
        value={volume}
        onChange={handleVolumeChange}
        aria-labelledby="emotion-volume-slider"
        sx={{ width: '80%', mt: 2, mb: 4 }}
        step={null}
        marks={volumes.map((label, index) => ({ value: index * 33.33, label }))}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2, mb: 4 }}>
        {sources.map((source) => (
          <Chip
            key={source}
            label={source}
            onClick={() => handleSourceToggle(source)}
            sx={{
              bgcolor: 'white',
              color: 'text.primary',
              '&:hover': { bgcolor: 'grey.200' },
              '&.selected': { bgcolor: 'primary.main', color: 'white' },
            }}
            className={selectedSources.includes(source) ? 'selected' : ''}
          />
        ))}
      </Box>
      <Button 
        variant="contained" 
        onClick={handleComplete}
        sx={{ 
          mt: 'auto', 
          width: '100%', 
          maxWidth: 400, 
          borderRadius: 24,
          bgcolor: 'white',
          color: 'text.primary',
          '&:hover': { bgcolor: 'grey.200' },
        }}
      >
        That is my mood for now
      </Button>
    </Box>
  );
};

export default EmotionVolumeView;