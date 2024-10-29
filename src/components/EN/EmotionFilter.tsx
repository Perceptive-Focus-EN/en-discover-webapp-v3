// src/components/EN/EmotionFilter.tsx
import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { EmotionName } from '../../feature/types/Reaction';
import { TimeRange } from './types/moodHistory';
import { VOLUME_LEVELS, VolumeLevelId } from './constants/volume';
import { SOURCE_CATEGORIES } from './constants/sources';

interface EmotionFilterProps {
  emotions: EmotionName[];
  selectedEmotion: EmotionName | null;
  onEmotionChange: (emotion: EmotionName | null) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  selectedVolume: VolumeLevelId | null;
  onVolumeChange: (volume: VolumeLevelId | null) => void;
  selectedSource: string | null;
  onSourceChange: (source: string | null) => void;
}

const EmotionFilter: React.FC<EmotionFilterProps> = ({
  emotions,
  selectedEmotion,
  onEmotionChange,
  timeRange,
  onTimeRangeChange,
  selectedVolume,
  onVolumeChange,
  selectedSource,
  onSourceChange,
}) => {
  const handleEmotionChange = (event: SelectChangeEvent<string>) => {
    onEmotionChange(event.target.value === '' ? null : event.target.value as EmotionName);
  };

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    onTimeRangeChange(event.target.value as TimeRange);
  };

  const handleVolumeChange = (event: SelectChangeEvent<string>) => {
    onVolumeChange(event.target.value === '' ? null : Number(event.target.value) as VolumeLevelId);
  };

  const handleSourceChange = (event: SelectChangeEvent<string>) => {
    onSourceChange(event.target.value === '' ? null : event.target.value);
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Emotion</InputLabel>
        <Select value={selectedEmotion || ''} onChange={handleEmotionChange} label="Emotion">
          <MenuItem value="">All</MenuItem>
          {emotions.map((emotion) => (
            <MenuItem key={emotion} value={emotion}>{emotion}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Time Range</InputLabel>
        <Select value={timeRange} onChange={handleTimeRangeChange} label="Time Range">
          <MenuItem value="day">Day</MenuItem>
          <MenuItem value="week">Week</MenuItem>
          <MenuItem value="month">Month</MenuItem>
          <MenuItem value="year">Year</MenuItem>
          <MenuItem value="lifetime">Lifetime</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Volume</InputLabel>
        <Select value={selectedVolume?.toString() || ''} onChange={handleVolumeChange} label="Volume">
          <MenuItem value="">All</MenuItem>
          {VOLUME_LEVELS.map((level) => (
            <MenuItem key={level.id} value={level.id.toString()}>{level.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Source</InputLabel>
        <Select value={selectedSource || ''} onChange={handleSourceChange} label="Source">
          <MenuItem value="">All</MenuItem>
          {SOURCE_CATEGORIES.map((category) => (
            <MenuItem key={category.id} value={category.name}>{category.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default EmotionFilter;