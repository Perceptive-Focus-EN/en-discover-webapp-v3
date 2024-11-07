import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '@/contexts/AuthContext';
import { MoodEntry } from '@/components/EN/types/moodHistory';
import { Emotion } from '@/components/EN/types/emotions';
import { emotionMappingsApi } from '@/lib/api/reactions/emotionMappings';
import { EmotionName } from '@/feature/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';
import MonitoringDashboard from './admin/monitoring';
import { MoodBoardRef } from '@/components/EN/MoodBoard';

const MoodBoard = dynamic(() => import('./moodboard'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const EmotionDisplay = dynamic(() => import('@/components/EN/EmotionDisplay/EmotionDisplay'), {
  loading: () => (
    <Box sx={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  ),
  ssr: false
});

const EmotionFilter = dynamic(() => import('@/components/EN/EmotionFilter'), {
  loading: () => <CircularProgress />,
  ssr: false
});

interface EmotionDisplayProps {
  emotions: Emotion[];
  onEmotionSelect: (emotion: MoodEntry) => Promise<void>;
  tenantId: string;
}

const DashboardPage: NextPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { user, loading: authLoading, onboardingStatus } = useAuth();
  const moodBoardRef = useRef<MoodBoardRef>(null);

  // Core states
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [displayLoading, setDisplayLoading] = useState(true);

  // Filter states
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedVolume, setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Monitoring states
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!authLoading) {
        if (!user) {
          router.replace('/login');
          return;
        }

        if (onboardingStatus && !onboardingStatus.isOnboardingComplete) {
          router.replace('/onboarding');
          return;
        }
        
        setDisplayLoading(true);
        try {
          const fetchedEmotions = await emotionMappingsApi.getEmotionMappings(user.userId);
          setEmotions(fetchedEmotions);
          setIsInitialized(true);
        } finally {
          setDisplayLoading(false);
        }
      }
    };

    initializeDashboard();
  }, [user, authLoading, onboardingStatus, router]);

  const handleEmotionDisplaySelect = useCallback(async (moodEntry: MoodEntry) => {
    if (!user) return;

    try {
      await emotionMappingsApi.updateEmotionMapping(user.userId, moodEntry.emotionId, {
        ...moodEntry,
        sources: moodEntry.sources.map(String),
      });
      messageHandler.success('Emotion updated successfully');
      if (moodBoardRef.current) {
        await moodBoardRef.current.fetchUserEmotions();
      }
    } catch (error) {
      messageHandler.error('Failed to update emotion');
    }
  }, [user]);

  const handleEmotionChange = (emotion: EmotionName | null) => setSelectedEmotion(emotion);
  const handleTimeRangeChange = (range: TimeRange) => setTimeRange(range);
  const handleVolumeChange = (volume: VolumeLevelId | null) => setSelectedVolume(volume);
  const handleSourceChange = (source: string | null) => setSelectedSource(source);
  const handleMonitoringAlerts = useCallback((hasIssues: boolean) => {
    setHasAlerts(hasIssues);
  }, []);

  if (authLoading || !isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ 
      maxWidth: '1200px', 
      margin: '0 auto',
      padding: theme.spacing(3),
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(3)
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Your Mood Dashboard
        </Typography>
        <IconButton color="inherit" onClick={() => setShowMonitoring(true)}>
          <Badge color="error" variant="dot" invisible={!hasAlerts}>
            <MonitoringIcon />
          </Badge>
        </IconButton>
      </Box>

      {!displayLoading && (
        <EmotionDisplay
          emotions={emotions}
          onEmotionSelect={handleEmotionDisplaySelect}
          tenantId={user.currentTenant?.tenantId ?? ''}
        />
      )}

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

      <Box sx={{ 
        height: { 
          xs: 'calc(100vh - 300px)', 
          sm: 'calc(100vh - 250px)', 
          md: 'calc(100vh - 200px)' 
        }, 
        overflow: 'hidden' 
      }}>
        <MoodBoard/>
      </Box>

      <Drawer
        anchor="right"
        open={showMonitoring}
        onClose={() => setShowMonitoring(false)}
        PaperProps={{ 
          sx: { 
            width: { xs: '100%', sm: 400 }, 
            padding: theme.spacing(3),
            bgcolor: 'background.paper' 
          } 
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: theme.spacing(3)
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