import React, { useEffect, useState, useCallback } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Typography, Box, useTheme, Alert } from '@mui/material';
import { frontendLogger } from '../utils/ErrorHandling/frontendLogger';
import { MoodEntry } from '@/components/EN/types/moodHistory';
import { Emotion } from '@/components/EN/types/emotions';
import { emotionMappingsApi } from '@/lib/api_s/reactions/emotionMappings';
import { useMoodBoard } from '@/contexts/MoodBoardContext';
import { EmotionName } from '@/components/Feed/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';

const MoodBoard = dynamic(() => import('../components/MoodBoard/MoodBoard'), {
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

  const [error, setError] = useState<string | null>(null);
  const [showMoodBoard, setShowMoodBoard] = useState(false);
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loadingEmotions, setLoadingEmotions] = useState(false);

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
      <Typography variant="h4" gutterBottom align="center">
        Your Mood Dashboard
      </Typography>
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
    </Box>
  );
};

export default DashboardPage;