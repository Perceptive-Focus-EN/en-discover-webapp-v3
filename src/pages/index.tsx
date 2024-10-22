import React, { useEffect, useState, useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { 
  CircularProgress, 
  Typography, 
  Box, 
  useTheme, 
  Alert, 
  IconButton, 
  Drawer, 
  Badge 
} from '@mui/material';
import MonitoringIcon from '@mui/icons-material/MonitorHeartOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import { frontendLogger } from '../utils/ErrorHandling/frontendLogger';
import { apiMonitoring } from '../utils/Monitoring/ApiMonitoring';
import { MoodEntry } from '@/components/EN/types/moodHistory';
import { Emotion } from '@/components/EN/types/emotions';
import { emotionMappingsApi } from '@/lib/api_s/reactions/emotionMappings';
import { useMoodBoard } from '@/contexts/MoodBoardContext';
import { EmotionName } from '@/components/Feed/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';

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

const MonitoringDashboard = dynamic(() => import('./admin/monitoring'), {
  loading: () => <CircularProgress />,
  ssr: false
});

const DashboardPage: NextPage = () => {
  const { user, loading: authLoading, onboardingStatus } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { saveMoodEntry } = useMoodBoard();

  const [error, setError] = useState<string | null>(null);
  const [showMoodBoard, setShowMoodBoard] = useState(false);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loadingEmotions, setLoadingEmotions] = useState(false);

  // Monitoring states
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Filter states
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedVolume, setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const fetchEmotions = useCallback(async () => {
    if (user) {
      try {
        setLoadingEmotions(true);
        const fetchedEmotions = await emotionMappingsApi.getEmotionMappings(user.userId);
        setEmotions(fetchedEmotions);
      } catch (error) {
        frontendLogger.error(error as Error, 'Failed to fetch emotions');
        setError('Failed to load emotions. Please try again.');
      } finally {
        setLoadingEmotions(false);
      }
    }
  }, [user]);

  // Fetch monitoring data
  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        const performanceMetrics = await apiMonitoring.getPerformanceMetrics();
        const health = await apiMonitoring.getSystemHealth();
        setMetrics(performanceMetrics);
        setSystemHealth(health);

        // Set alert badge if there are issues
        setHasAlerts(
          health?.totalCpu > 80 || 
          health?.totalMemory > 80 || 
          Array.isArray(performanceMetrics) && performanceMetrics.some((m: any) => m.errorRate > 10)
        );
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      }
    };

    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        const errorMessage = "Loading is taking longer than expected. Please refresh the page.";
        setError(errorMessage);
        frontendLogger.warn('Loading timeout on dashboard page', errorMessage);
      }
    }, 10000);

    if (!authLoading) {
      clearTimeout(timeout);
      if (user) {
        if (onboardingStatus && !onboardingStatus.isOnboardingComplete) {
          frontendLogger.info('Redirecting to onboarding', 'Completing user onboarding', { userId: user.userId });
          router.replace('/onboarding');
        } else {
          frontendLogger.info('Showing dashboard', 'Loading MoodBoard', { userId: user.userId });
          setShowMoodBoard(true);
          fetchEmotions();
        }
      } else {
        frontendLogger.info('Redirecting to login', 'Please log in');
        router.replace('/login');
      }
    }

    return () => clearTimeout(timeout);
  }, [user, authLoading, onboardingStatus, router, fetchEmotions]);

  const handleEmotionSelect = async (moodEntry: Omit<MoodEntry, 'userId' | '_id' | 'timeStamp' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!user) {
      frontendLogger.error(new Error('No user found'), 'Failed to log mood entry: No user');
      setError('You must be logged in to record a mood.');
      return;
    }

    try {
      const fullMoodEntry: MoodEntry = {
        ...moodEntry,
        userId: user.userId,
        timeStamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveMoodEntry(fullMoodEntry);
      frontendLogger.info('Mood entry logged', 'Your mood has been recorded', { moodEntry: fullMoodEntry });
      
      // Refresh emotions after logging a new mood
      await fetchEmotions();
    } catch (error) {
      frontendLogger.error(error as Error, 'Failed to log mood entry', { moodEntry });
      setError('Failed to record your mood. Please try again.');
    }
  };

  // Filter change handlers
  const handleEmotionChange = (emotion: EmotionName | null) => setSelectedEmotion(emotion);
  const handleTimeRangeChange = (range: TimeRange) => setTimeRange(range);
  const handleVolumeChange = (volume: VolumeLevelId | null) => setSelectedVolume(volume);
  const handleSourceChange = (source: string | null) => setSelectedSource(source);

  if (authLoading || loadingEmotions) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
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
        <Badge color="error" variant="dot" invisible={!hasAlerts}>
          <IconButton 
            onClick={() => setShowMonitoring(true)}
            size="small"
            sx={{ ml: 2, '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
          >
            <MonitoringIcon />
          </IconButton>
        </Badge>
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

      {/* Monitoring Drawer */}
      <Drawer
        anchor="right"
        open={showMonitoring}
        onClose={() => setShowMonitoring(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 3, bgcolor: 'background.paper' } }}
      >
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">System Health</Typography>
            <IconButton onClick={() => setShowMonitoring(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Monitoring Content */}
          {systemHealth && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" color="textSecondary">System Status</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography>CPU: {systemHealth.totalCpu.toFixed(1)}%</Typography>
                <Typography>Memory: {systemHealth.totalMemory.toFixed(1)}%</Typography>
                <Typography>Active Connections: {systemHealth.totalConnections}</Typography>
                <Typography>Healthy Servers: {systemHealth.healthyServers}</Typography>
              </Box>
            </Box>
          )}

          {metrics && metrics.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">API Performance</Typography>
              {metrics.map((metric: any) => (
                <Box key={metric.endpoint} sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">{metric.endpoint}</Typography>
                  <Typography variant="body2">Response Time: {metric.averageResponseTime.toFixed(0)}ms</Typography>
                  <Typography variant="body2">Error Rate: {((metric.errorCount / metric.requestCount) * 100).toFixed(1)}%</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default DashboardPage;
