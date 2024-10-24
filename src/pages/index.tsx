import React, { useEffect, useState, useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { 
  CircularProgress, 
  Typography, 
  Box, 
  useTheme, 
  IconButton, 
  Badge, 
  Drawer 
} from '@mui/material';
import MonitoringIcon from '@mui/icons-material/MonitorHeartOutlined';
import CloseIcon from '@mui/icons-material/Close'; // Import CloseIcon
import { useAuth } from '../contexts/AuthContext';
import { MoodEntry } from '@/components/EN/types/moodHistory';
import { Emotion } from '@/components/EN/types/emotions';
import { emotionMappingsApi } from '@/lib/api_s/reactions/emotionMappings';
import { useMoodBoard } from '@/contexts/MoodBoardContext';
import { EmotionName } from '@/components/Feed/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import MonitoringDashboard from './admin/monitoring'; // Import MonitoringDashboard

const MoodBoard = dynamic(() => import('./moodboard'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const EmotionDisplay = dynamic(() => import('@/components/EN/EmotionDisplay/EmotionDisplay'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const EmotionFilter = dynamic(() => import('@/components/EN/EmotionFilter'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const DashboardPage: NextPage = () => {
  const { user, loading: authLoading, onboardingStatus } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { saveMoodEntry } = useMoodBoard();

  const [showMoodBoard, setShowMoodBoard] = useState(false);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loadingEmotions, setLoadingEmotions] = useState(false);

  // Monitoring state
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  // Filter states
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedVolume, setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const fetchEmotions = useCallback(async () => {
    if (user) {
      setLoadingEmotions(true);
      const fetchedEmotions = await emotionMappingsApi.getEmotionMappings(user.userId);
      setEmotions(fetchedEmotions);
      setLoadingEmotions(false);
    }
  }, [user]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        console.warn("Loading is taking longer than expected. Please refresh the page.");
      }
    }, 10000);

    if (!authLoading) {
      clearTimeout(timeout);
      if (user) {
        if (onboardingStatus && !onboardingStatus.isOnboardingComplete) {
          router.replace('/onboarding');
        } else {
          setShowMoodBoard(true);
          fetchEmotions();
        }
      } else {
        router.replace('/login');
      }
    }

    return () => clearTimeout(timeout);
  }, [user, authLoading, onboardingStatus, router, fetchEmotions]);

  const handleEmotionSelect = async (moodEntry: Omit<MoodEntry, 'userId' | '_id' | 'timeStamp' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!user) {
      return;
    }

    const fullMoodEntry: MoodEntry = {
      ...moodEntry,
      userId: user.userId,
      timeStamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveMoodEntry(fullMoodEntry);
    
    // Refresh emotions after logging a new mood
    await fetchEmotions();
  };

  // Filter change handlers
  const handleEmotionChange = (emotion: EmotionName | null) => setSelectedEmotion(emotion);
  const handleTimeRangeChange = (range: TimeRange) => setTimeRange(range);
  const handleVolumeChange = (volume: VolumeLevelId | null) => setSelectedVolume(volume);
  const handleSourceChange = (source: string | null) => setSelectedSource(source);

  // Handler for alerts from MonitoringDashboard
  const handleMonitoringAlerts = useCallback((hasIssues: boolean) => {
    setHasAlerts(hasIssues);
  }, []);

  if (authLoading || loadingEmotions) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!showMoodBoard) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: 'auto', padding: theme.spacing(3) }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Your Mood Dashboard
        </Typography>
        <IconButton color="inherit" onClick={() => setShowMonitoring(true)}>
          <Badge color="error" variant="dot" invisible={!hasAlerts}>
            <MonitoringIcon />
          </Badge>
        </IconButton>
      </Box>

      <Box sx={{ mb: 4 }}>
        <EmotionDisplay
          emotions={emotions}
          onEmotionSelect={handleEmotionSelect}
          tenantId={user?.tenantId || ''}
        />
      </Box>

      <EmotionFilter
        emotions={emotions.map(e => e.emotionName)}
        selectedEmotion={selectedEmotion}
        onEmotionChange={handleEmotionChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        selectedVolume={selectedVolume}
        onVolumeChange={handleVolumeChange}
        selectedSource={selectedSource}
        onSourceChange={handleSourceChange}
      />

      <Box sx={{ height: { xs: 'calc(100vh - 300px)', sm: 'calc(100vh - 250px)', md: 'calc(100vh - 200px)' }, overflow: 'hidden' }}>
        <MoodBoard
          emotions={emotions}
          selectedEmotion={selectedEmotion}
          timeRange={timeRange}
          selectedVolume={selectedVolume}
          selectedSource={selectedSource}
        />
      </Box>

      / Replace the current Drawer with this:
<Drawer
  anchor="right"
  open={showMonitoring}
  onClose={() => setShowMonitoring(false)}
  PaperProps={{ 
    sx: { 
      width: { xs: '100%', sm: 400 }, 
      p: 3, 
      bgcolor: 'background.paper' 
    } 
  }}
>
  <Box sx={{ width: '100%' }}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 3 
    }}>
      <Typography variant="h6">System Health</Typography>
      <IconButton 
        onClick={() => setShowMonitoring(false)} 
        size="small"
      >
        <CloseIcon />
      </IconButton>
    </Box>
    <MonitoringDashboard onAlertChange={handleMonitoringAlerts} />
  </Box>
</Drawer>
    </Box>
  );
};

export default DashboardPage;
