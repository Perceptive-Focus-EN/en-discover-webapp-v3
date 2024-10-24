// File: src/components/EN/MoodBoard.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  IconButton,
  Button,
  SwipeableDrawer,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  BarChart as ChartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { ColorPalette, palettes } from '@/components/EN/types/colorPalette';
import { Emotion } from '@/components/EN/types/emotions';
import { emotionMappingsApi } from '@/lib/api_s/reactions/emotionMappings';
import BubbleBarChart from '@/components/EN/BubbleBarChart';
import MoodBubbleChart from '@/components/EN/charts/MoodBubbleChart';
import RadarChart from '@/components/EN/RadarChart';
import LineGraph from '@/components/EN/LineGraph';
import Draggables from '@/components/EN/Draggables';
import PercentileBubbles from '@/components/EN/Draggables';
import PalettePreview from '@/components/EN/PalettePreview';
import EmotionSelection from '@/components/EN/EmotionSelection/EmotionSelection';
import ChartOptions from '@/components/EN/ChartOptions';
import BubbleChart from '@/components/EN/BubbleChart';
import EmotionFilter from '@/components/EN/EmotionFilter';
import { MoodEntry } from '@/components/EN/types/moodHistory';
import { EmotionName } from '@/components/Feed/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import { useMoodBoard } from '@/contexts/MoodBoardContext';

export interface MoodBoardProps {
  emotions: Emotion[];
  selectedEmotion: EmotionName | null;
  timeRange: TimeRange;
  selectedVolume: VolumeLevelId | null;
  selectedSource: string | null;
}

const MoodBoard: React.FC<MoodBoardProps> = ({
  emotions,
  selectedEmotion,
  selectedVolume,
  selectedSource
}) => {  
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [openMoodSelector, setOpenMoodSelector] = useState<boolean>(false);
  const [openChartOptions, setOpenChartOptions] = useState<boolean>(false);
  const [chartType, setChartType] = useState<string>('Bubbles');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [userEmotions, setUserEmotions] = useState<Emotion[]>([]);
  const [loadingEmotions, setLoadingEmotions] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // FILTER STATES
  const [setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [ setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [setSelectedSource] = useState<string | null>(null);

  const { saveMoodEntry } = useMoodBoard();

  const fetchUserEmotions = useCallback(async () => {
    if (user) {
      try {
        setLoadingEmotions(true);
        setError(null);
        const emotions = await emotionMappingsApi.getEmotionMappings(user.userId);
        setUserEmotions(emotions);
      } catch (error) {
        setError('Failed to load your emotions. Please try again.');
      } finally {
        setLoadingEmotions(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchUserEmotions();
      }
    }
  }, [user, authLoading, router, fetchUserEmotions]);

  const toggleChartOptions = useCallback((open: boolean) => {
    setOpenChartOptions(open);
  }, []);

  const handleChartTypeChange = useCallback((type: string) => {
    setChartType(type);
    setOpenChartOptions(false);
  }, []);

  const handleEmotionComplete = useCallback((selectedEmotions: Emotion[]) => {
    if (selectedEmotions.length > 0) {
      setOpenMoodSelector(false);
    }
  }, []);

  const handlePaletteSelect = useCallback((palette: ColorPalette) => {
    setSelectedPalette(palette);
  }, []);

  const handleEmotionSelect = useCallback(async (moodEntry: Omit<MoodEntry, 'userId' | 'createdAt' | 'updatedAt' | 'timeStamp'>) => {
    if (!user) return;

    const fullMoodEntry: MoodEntry = {
      ...moodEntry,
      userId: user.userId,
      timeStamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveMoodEntry(fullMoodEntry);
    } catch (error) {
      setError('Failed to save mood entry. Please try again.');
    }
  }, [saveMoodEntry, user]);

  const renderChart = useCallback(() => {
    const filteredEmotions = userEmotions.filter((emotion) => {
      if (selectedEmotion && emotion.emotionName !== selectedEmotion) return false;
      if (selectedVolume && emotion.volume !== selectedVolume) return false;
      if (selectedSource && !emotion.sources.includes(selectedSource)) return false;
      return true;
    });

    const ChartComponent = (() => {
      switch (chartType) {
        case 'Bubbles':
          return BubbleChart;
        case 'Balance':
          return RadarChart;
        case 'Graph':
          return LineGraph;
        case 'Draggables':
          return Draggables;
        case 'BubbleBar':
          return BubbleBarChart;
        default:
          return MoodBubbleChart;
      }
    })();

    return (
      <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
        <ChartComponent
          emotions={filteredEmotions}
        />
      </Box>
    );
  }, [chartType, userEmotions, selectedEmotion, selectedVolume, selectedSource, timeRange, handleEmotionSelect]);

  if (authLoading || loadingEmotions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', p: 3, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>Moodboard</Typography>
        <Box>
          <IconButton size="small" onClick={fetchUserEmotions} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <IconButton size="small" sx={{ mr: 1 }}>
            <FilterIcon />
          </IconButton>
          <IconButton size="small" onClick={() => toggleChartOptions(true)}>
            <ChartIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2,
          boxShadow: 2,
          height: { xs: 300, sm: 400, md: 500 },
          width: '100%',
          mb: 4,
          overflow: 'hidden',
        }}
      >
        {userEmotions.length > 0 ? renderChart() : (
          <Typography variant="h6" color="text.secondary">No emotions found</Typography>
        )}
      </Box>

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        fullWidth
        sx={{ mt: 2 }}
        onClick={() => setOpenMoodSelector(true)}
      >
        {userEmotions.length > 0 ? "Update Your Mood" : "Set Your Mood"}
      </Button>

      <SwipeableDrawer
        anchor="bottom"
        open={openMoodSelector}
        onClose={() => setOpenMoodSelector(false)}
        onOpen={() => setOpenMoodSelector(true)}
        PaperProps={{
          sx: {
            maxHeight: '80vh',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            bgcolor: 'background.default',
          },
        }}
      >
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', height: '100%', overflow: 'auto' }}>
          <Typography variant="h5" align="center" gutterBottom>
            Hey, <span style={{ color: theme.palette.primary.main }}>{user.firstName}!</span>
            <br />
            How are you feeling today?
          </Typography>
          <PalettePreview palettes={palettes} onSelect={handlePaletteSelect} />
          {selectedPalette && openMoodSelector && (
            <EmotionSelection
              onComplete={handleEmotionComplete}
              colorPalette={selectedPalette}
              paletteVersion={0}
              initialEmotions={userEmotions}
            />
          )}
        </Box>
      </SwipeableDrawer>

      <ChartOptions
        open={openChartOptions}
        onClose={() => setOpenChartOptions(false)}
        onSelect={handleChartTypeChange}
        currentSelection={chartType}
      />
    </Box>
  );
};

export default MoodBoard;
