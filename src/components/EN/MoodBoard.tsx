import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
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
import PalettePreview from '@/components/EN/PalettePreview';
import EmotionSelection from '@/components/EN/EmotionSelection/EmotionSelection';
import ChartOptions from '@/components/EN/ChartOptions';
import BubbleChart from '@/components/EN/BubbleChart';
import { MoodEntry } from '@/components/EN/types/moodHistory';
import { EmotionName } from '@/feature/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import { mockEmotionHistory } from './mockData/emotionHistory';

export interface MoodBoardRef {
  fetchUserEmotions: () => Promise<void>;
}

export interface MoodBoardProps {
  selectedEmotion: EmotionName | null;
  timeRange: TimeRange;
  selectedVolume: VolumeLevelId | null;
  selectedSource: string | null;
  onEmotionsUpdate: (emotions: Emotion[]) => void;
}

const MoodBoard = forwardRef<MoodBoardRef, MoodBoardProps>(({
  selectedEmotion,
  timeRange,
  selectedVolume,
  selectedSource,
  onEmotionsUpdate
}, ref) => {
  const theme = useTheme();
  const { user } = useAuth();

  // Local states
  const [openMoodSelector, setOpenMoodSelector] = useState<boolean>(false);
  const [openChartOptions, setOpenChartOptions] = useState<boolean>(false);
  const [chartType, setChartType] = useState<string>('Bubbles');
  const [selectedPalette, setSelectedPalette] = useState<ColorPalette | null>(null);
  const [userEmotions, setUserEmotions] = useState<Emotion[]>([]);
  const [loadingEmotions, setLoadingEmotions] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user emotions and handle errors
  const fetchUserEmotions = useCallback(async () => {
    if (!user) return;

    setLoadingEmotions(true);
    try {
      setError(null);
      const emotions = await emotionMappingsApi.getEmotionMappings(user.userId);
      setUserEmotions(emotions);
      onEmotionsUpdate(emotions);
      messageHandler.success('Emotions loaded successfully');
    } catch (error) {
      setError('Failed to load your emotions. Please try again.');
      messageHandler.error('Failed to load emotions');
    } finally {
      setLoadingEmotions(false);
    }
  }, [user, onEmotionsUpdate]);

  // Use useImperativeHandle to expose fetchUserEmotions to parent components
  useImperativeHandle(ref, () => ({
    fetchUserEmotions,
  }));

  useEffect(() => {
    fetchUserEmotions();
  }, [fetchUserEmotions]);

  const handleEmotionComplete = useCallback(async (selectedEmotions: Emotion[]) => {
    if (selectedEmotions.length > 0) {
      setOpenMoodSelector(false);
      await fetchUserEmotions();
    }
  }, [fetchUserEmotions]);

  const handleEmotionSelect = async (
    moodEntry: Omit<MoodEntry, 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) return;

    try {
      await emotionMappingsApi.updateEmotionMapping(user.userId, moodEntry.emotionId, {
        ...moodEntry,
        sources: moodEntry.sources.map(String),
      });
      messageHandler.success('Emotion updated successfully');
      await fetchUserEmotions();
    } catch (error) {
      setError('Failed to update your emotion. Please try again.');
      messageHandler.error('Failed to update emotion');
    }
  };

    // Render the selected chart type
    // In MoodBoard.tsx, update the renderChart function to render the selected chart type:

    const renderChart = useCallback(() => {
  if (!userEmotions?.length) return null;

  const filteredEmotions = userEmotions.filter((emotion) => {
    if (selectedEmotion && emotion.emotionName !== selectedEmotion) return false;
    if (selectedVolume && emotion.volume !== selectedVolume) return false;
    if (selectedSource && !emotion.sources.includes(selectedSource)) return false;
    return true;
  });

  const ChartComponent = (() => {
    switch (chartType) {
      case 'BubbleBar':
        return (props: any) => (
          <BubbleBarChart
            {...props}
                timeRange={timeRange} // Only need to pass timeRange separately
                history={mockEmotionHistory} // Add mock history here
                // history={filteredEmotions}
          />
        );
      case 'Balance':
        return RadarChart;
      case 'Graph':
        return LineGraph;
      case 'Draggables':
        return Draggables;
      case 'Bubbles':
        return BubbleChart;
      default:
        return MoodBubbleChart;
    }
  })();

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      <ChartComponent emotions={filteredEmotions} />
    </Box>
  );
    }, [chartType, userEmotions, selectedEmotion, selectedVolume, selectedSource, timeRange]);


  if (loadingEmotions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>Moodboard</Typography>
        <Box>
          <IconButton size="small" onClick={() => fetchUserEmotions()} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <IconButton size="small" onClick={() => setOpenChartOptions(true)}>
            <ChartIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
          overflow: 'hidden',
        }}
      >
        {userEmotions?.length > 0 ? renderChart() : (
          <Typography variant="h6" color="text.secondary">
            You haven't set any emotions yet. Click the button below to get started!
          </Typography>
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
        {userEmotions?.length > 0 ? "Update Your Mood" : "Set Your Mood"}
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
            Hey, <span style={{ color: theme.palette.primary.main }}>{user?.firstName}!</span>
            <br />
            How are you feeling today?
          </Typography>
          <PalettePreview palettes={palettes} onSelect={setSelectedPalette} />
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
        onSelect={setChartType}
        currentSelection={chartType}
      />
    </Box>
  );
});

MoodBoard.displayName = 'MoodBoard';

export default MoodBoard;
