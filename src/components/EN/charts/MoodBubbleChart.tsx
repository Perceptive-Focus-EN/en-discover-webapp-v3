import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  SwipeableDrawer,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import dynamic from 'next/dynamic';
import { Emotion } from '../types/emotions';
import MoodHistoryChart from '../MoodHistoryChart';
import { BarChart, Circle } from 'lucide-react';
import { useMoodBoard } from '../../../contexts/MoodBoardContext';
import { TimeRange } from '../types/moodHistory';

const MoodIconView = dynamic(() => import('../MoodIconView'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

interface MoodBubbleProps {
  color: string;
  name: string;
  size: number;
  left: string;
  top: string;
  onClick: () => void;
}

const MoodBubble: React.FC<MoodBubbleProps> = ({ color, name, size, left, top, onClick }) => {
  const theme = useTheme();

  return (
    <Box
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(to bottom, ${color}, ${color}dd)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: theme.shadows[3],
        border: '2px solid rgba(255, 255, 255, 0.1)',
        position: 'absolute',
        left,
        top,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'scale(1.1)',
          zIndex: 1,
        },
      }}
    >
      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
        {name}
      </Typography>
    </Box>
  );
};


interface MoodBubbleChartProps {
  emotions: Emotion[];
}

const volumeLevels = ['A little', 'Normal', 'Enough', 'A lot'];

const MoodBubbleChart: React.FC<MoodBubbleChartProps> = ({ emotions }) => {
  const theme = useTheme();
  const { moodHistory, isLoading, error, fetchMoodData, getStartDate } = useMoodBoard();
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'icons'>('chart');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  useEffect(() => {
    if (selectedEmotion && drawerOpen) {
      fetchMoodData({ emotion: selectedEmotion.emotionName, timeRange });
    }
  }, [selectedEmotion, timeRange, drawerOpen, fetchMoodData]);

  const getRandomPosition = (max: number) => Math.floor(Math.random() * max);

  const handleBubbleClick = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
    setDrawerOpen(true);
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'chart' | 'icons' | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleTimeRangeChange = (event: SelectChangeEvent<TimeRange>) => {
    setTimeRange(event.target.value as TimeRange);
  };

  if (!Array.isArray(emotions) || emotions.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Typography variant="h6" color="text.secondary">No mood data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', minHeight: 300 }}>
      {emotions.map((emotion, index) => (
        <MoodBubble
          key={emotion.id || index}
          color={emotion.color || theme.palette.grey[400]}
          name={emotion.emotionName}
          size={80 + (emotion.volume || 0) * 10}
          left={`${getRandomPosition(80)}%`}
          top={`${getRandomPosition(80)}%`}
          onClick={() => handleBubbleClick(emotion)}
        />
      ))}
      <SwipeableDrawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
      >
        <Paper sx={{ p: 3, height: '70vh', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          {selectedEmotion && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{selectedEmotion.emotionName} Mood History</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl variant="outlined" size="small">
                    <InputLabel>Time Range</InputLabel>
                    <Select
                      value={timeRange}
                      onChange={handleTimeRangeChange}
                      label="Time Range"
                    >
                      <MenuItem value="day">Day</MenuItem>
                      <MenuItem value="week">Week</MenuItem>
                      <MenuItem value="month">Month</MenuItem>
                      <MenuItem value="year">Year</MenuItem>
                      <MenuItem value="lifetime">Lifetime</MenuItem>
                    </Select>
                  </FormControl>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    aria-label="view mode"
                  >
                    <ToggleButton value="chart" aria-label="chart view">
                      <BarChart size={20} />
                    </ToggleButton>
                    <ToggleButton value="icons" aria-label="icon view">
                      <Circle size={20} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : viewMode === 'chart' ? (
                <MoodHistoryChart
                  emotion={{ ...selectedEmotion, color: selectedEmotion?.color || theme.palette.grey[400] }}
                  history={moodHistory}
                  timeRange={timeRange}
                />
              ) : (
                <MoodIconView
                    emotion={{ ...selectedEmotion, 
                    color: selectedEmotion?.color || theme.palette.grey[400] }}
                    timeRange={timeRange} history={[]}
                                        />
              )}
            </>
          )}
        </Paper>
      </SwipeableDrawer>
    </Box>
  );
};

export default MoodBubbleChart;