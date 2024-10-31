import React, { useState, useEffect, useCallback } from 'react';
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
import { Emotion } from './types/emotions';
import MoodHistoryChart from './MoodHistoryChart';
import { BarChart, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMoodBoard } from '../../contexts/MoodBoardContext';
import { SOURCE_CATEGORIES, SourceCategoryId, SourceCategoryName } from './constants/sources';
import { VOLUME_LEVELS, VolumeLevelId, VolumeLevelName } from './constants/volume';
import { MoodEntry, MoodHistoryItem, TimeRange, MoodHistoryQuery, convertSourceIdsToNames } from './types/moodHistory';
import { EmotionName, EmotionId } from './constants/emotionsAndCategories';


const MoodIconView = dynamic(() => import('./MoodIconView'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

interface BubbleData {
  color: string;
  name: string;
  percent: number;
  size: number;
  position: { left: number; top: number };
  velocity: { x: number; y: number };
}

interface BubbleChartProps {
  emotions: Emotion[];
  selectedEmotion: EmotionName | null;
  timeRange: TimeRange;
  onEmotionSelect: (moodEntry: Omit<MoodEntry, 'userId' | 'createdAt' | 'updatedAt' | '_id' | 'timeStamp'>) => Promise<void>;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

const GRAVITY = 0.2;
const BOUNCE_DAMPING = 0.9;
const MIN_VELOCITY = 0.5;
const BUOYANCY = -0.1;
const FLOAT_RANGE = 0.5;

const getRandomPosition = (existingBubbles: BubbleData[], size: number, max: number) => {
  let position;
  let overlapping;

  do {
    overlapping = false;
    position = {
      left: Math.floor(Math.random() * (max - size)),
      top: Math.floor(Math.random() * (max - size)),
    };

    for (let bubble of existingBubbles) {
      const dx = bubble.position.left - position.left;
      const dy = bubble.position.top - position.top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (bubble.size + size) / 2) {
        overlapping = true;
        break;
      }
    }
  } while (overlapping);

  return position;
};

const getRandomVelocity = () => (Math.random() - 0.5) * 3;

const handleCollision = (bubble1: BubbleData, bubble2: BubbleData) => {
  const dx = bubble2.position.left - bubble1.position.left;
  const dy = bubble2.position.top - bubble1.position.top;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const overlap = (bubble1.size + bubble2.size) / 2 - distance;
  const totalMass = bubble1.size + bubble2.size;
  const mass1 = bubble1.size / totalMass;
  const mass2 = bubble2.size / totalMass;
  const overlap1 = overlap * mass2;
  const overlap2 = overlap * mass1;
  // ... (keep the collision handling logic)
};

const BubbleChart: React.FC<BubbleChartProps> = ({
  emotions,
  selectedEmotion,
  timeRange,
  onEmotionSelect,
  onTimeRangeChange,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [containerSize, setContainerSize] = useState<number>(300);
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'icons'>('chart');
  const [setMoodHistory] = useState<MoodHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeRange, setCurrentTimeRange] = useState<TimeRange>(timeRange);
  const { fetchMoodData, moodHistory, isLoading } = useMoodBoard();


type EmotionName = 'EUPHORIC' | 'TRANQUIL' | 'REACTIVE' | 'SORROW' | 'FEAR' | 'DISGUST' | 'SUSPENSE' | 'ENERGY';

type EmotionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

  
  // Mock data for testing
  const mockMoodHistory: MoodHistoryItem[] = [
    {
      emotionId: 1, emotionName: 'EUPHORIC', color: '#FFC107', volume: 2, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 2, emotionName: 'TRANQUIL', color: '#03A9F4', volume: 1, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 3, emotionName: 'REACTIVE', color: '#F44336', volume: 3, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 4, emotionName: 'SORROW', color: '#9C27B0', volume: 4, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 5, emotionName: 'FEAR', color: '#2196F3', volume: 2, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 6, emotionName: 'DISGUST', color: '#4CAF50', volume: 1, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 7, emotionName: 'SUSPENSE', color: '#FF5722', volume: 3, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
    {
      emotionId: 8, emotionName: 'ENERGY', color: '#795548', volume: 4, sources: [1], date: new Date().toISOString(),
      userId: '',
      tenantId: '',
      timeStamp: '',
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    },
  ];


  const updateBubbles = useCallback(() => {
    setBubbles((prevBubbles) => {
      return prevBubbles.map((bubble) => {
        let { left, top } = bubble.position;
        let { x, y } = bubble.velocity;

        if (left <= 0 || left >= containerSize - bubble.size) {
          x = -x;
        }

        if (top <= 0 || top >= containerSize - bubble.size) {
          y = -y;
        }

        for (let otherBubble of prevBubbles) {
          if (bubble !== otherBubble) {
            const dx = otherBubble.position.left - left;
            const dy = otherBubble.position.top - top;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < (bubble.size + otherBubble.size) / 2) {
              handleCollision(bubble, otherBubble);
            }
          }
        }

        y += GRAVITY;
        if (y > 0 && y < MIN_VELOCITY) {
          y = MIN_VELOCITY;
        }

        return {
          ...bubble,
          position: { left: left + x, top: top + y },
          velocity: { x, y },
        };
      });
    });
  }, [containerSize]);

  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 600 ? 200 : 300;
      setContainerSize(newSize);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const interval = setInterval(updateBubbles, 30);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateBubbles]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { startDate, endDate } = getDateRangeFromTimeRange(currentTimeRange);

        await fetchMoodData({
          emotion: selectedEmotion ? emotions.find(e => e.emotionName === selectedEmotion) : undefined,
          timeRange: currentTimeRange,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        } as MoodHistoryQuery);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch emotion data');
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentTimeRange, fetchMoodData, selectedEmotion]);

  const getDateRangeFromTimeRange = (range: TimeRange): { startDate: Date, endDate: Date } => {
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'lifetime':
        startDate = new Date(0); // Beginning of time
        break;
    }

    return { startDate, endDate };
  };

  useEffect(() => {
    if (mockMoodHistory.length > 0) {
      const emotionCounts = emotions.reduce((acc, emotion) => {
        acc[emotion.id] = 0;
        return acc;
      }, {} as Record<number, number>);

      mockMoodHistory.forEach(entry => {
        if (emotionCounts.hasOwnProperty(entry.emotionId)) {
          emotionCounts[entry.emotionId]++;
        }
      });

      const totalCount = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);

      setBubbles(
        emotions.map((emotion) => {
          const count = emotionCounts[emotion.id] || 0;
          const percent = totalCount > 0 ? (count / totalCount) * 100 : 12.5; // Default to 12.5% if no data
          return {
            color: emotion.color,
            name: emotion.emotionName,
            percent,
            size: Math.max(40, (percent / 100) * containerSize),
            position: { left: 0, top: 0 },
            velocity: { x: getRandomVelocity(), y: getRandomVelocity() },
          };
        }).map((bubble, index, allBubbles) => ({
          ...bubble,
          position: getRandomPosition(allBubbles.slice(0, index), bubble.size, containerSize),
        }))
      );
    } else {
      // If there's no mood history, set equal sizes for all emotions
      setBubbles(
        emotions.map((emotion) => ({
          color: emotion.color,
          name: emotion.emotionName,
          percent: 12.5, // 100% / 8 emotions
          size: Math.max(40, (12.5 / 100) * containerSize),
          position: { left: 0, top: 0 },
          velocity: { x: getRandomVelocity(), y: getRandomVelocity() },
        })).map((bubble, index, allBubbles) => ({
          ...bubble,
          position: getRandomPosition(allBubbles.slice(0, index), bubble.size, containerSize),
        }))
      );
    }
  }, [containerSize, emotions, mockMoodHistory]);

  const handleBubbleClick = (emotion: Emotion) => {
  const moodEntry: Omit<MoodEntry, 'userId' | 'createdAt' | 'updatedAt' | '_id' | 'timeStamp'> = {
    tenantId: '', // You might want to get this from a context or prop
    emotionId: emotion.id as EmotionId,
    color: emotion.color,
    volume: 2 as VolumeLevelId, // Default value
    sources: [SOURCE_CATEGORIES[0].id as SourceCategoryId], // Default to 'Everything'
    date: new Date().toISOString(),
  };
  onEmotionSelect(moodEntry);
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
    const newTimeRange = event.target.value as TimeRange;
    setCurrentTimeRange(newTimeRange);
    onTimeRangeChange(newTimeRange);
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!Array.isArray(emotions) || emotions.length === 0) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Typography variant="h6" color="text.secondary">No mood data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', minHeight: 300 }}>
      {bubbles.map((bubble, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: bubble.size,
            height: bubble.size,
            borderRadius: '50%',
            background: `linear-gradient(to bottom, ${bubble.color}, ${bubble.color}dd)`,
            left: bubble.position.left,
            top: bubble.position.top,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: theme.shadows[3],
            border: '2px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.1)',
              zIndex: 1,
            },
          }}
          onClick={() => handleBubbleClick(emotions[index])}
        >
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
            {bubble.name}
          </Typography>
        </Box>
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
                <Typography variant="h6">{selectedEmotion} Mood History</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl variant="outlined" size="small">
                    <InputLabel>Time Range</InputLabel>
                    <Select
                      value={currentTimeRange}
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
              {viewMode === 'chart' ? (
              <MoodHistoryChart
                  emotion={emotions.find(e => e.emotionName === selectedEmotion) || emotions[0]}
                  history={moodHistory.filter(entry => entry.emotionName === selectedEmotion)}  // Use filtered emotions directly
                  timeRange={currentTimeRange}
                />
                ) : (
              <MoodIconView
                emotion={emotions.find(e => e.emotionName === selectedEmotion) || emotions[0]}
                history={moodHistory.filter(entry => entry.emotionName === selectedEmotion)}  // Use filtered emotions directly
                timeRange={currentTimeRange}
              />
            )}
            </>
          )}
        </Paper>
      </SwipeableDrawer>
    </Box>
  );
};

export default BubbleChart;