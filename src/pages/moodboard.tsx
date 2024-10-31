import { NextPage } from 'next';
import { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CircularProgress } from '@mui/material';
import { EmotionName } from '@/feature/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import { Emotion } from '@/components/EN/types/emotions';
import { MoodBoardRef } from '@/components/EN/MoodBoard';
import { emotionMappingsApi } from '@/lib/api_s/reactions/emotionMappings';
import { useAuth } from '@/contexts/AuthContext';

const DynamicMoodBoard = dynamic(
  () => import('@/components/EN/MoodBoard'),
  {
    loading: () => <CircularProgress />,
    ssr: false
  }
);

const MoodboardPage: NextPage = () => {
  const { user } = useAuth();
  const moodBoardRef = useRef<MoodBoardRef>(null);

  // Core states
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [historyData, setHistoryData] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedVolume, setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Fetch emotion history based on timeRange
  useEffect(() => {
    const fetchEmotionHistory = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const endDate = new Date();
        let startDate = new Date();

        // Calculate date range based on timeRange
        switch (timeRange) {
          case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case 'lifetime':
            startDate.setFullYear(startDate.getFullYear() - 5);
            break;
          default:
            startDate.setDate(startDate.getDate() - 7);
        }

        // Fetch emotions for the selected date range
        const fetchedEmotions = await emotionMappingsApi.getEmotionMappings(user.userId);

        // Filter emotions based on selected filters
        let filteredEmotions = fetchedEmotions;

        if (selectedEmotion) {
          filteredEmotions = filteredEmotions.filter(
            (            emotion: { emotionName: string; }) => emotion.emotionName === selectedEmotion
          );
        }

        if (selectedVolume !== null) {
          filteredEmotions = filteredEmotions.filter(
            (            emotion: { volume: number; }) => emotion.volume === selectedVolume
          );
        }

        if (selectedSource) {
          filteredEmotions = filteredEmotions.filter(
            (            emotion: { sources: string | string[]; }) => emotion.sources.includes(selectedSource)
          );
        }

        setHistoryData(filteredEmotions);
        setEmotions(fetchedEmotions); // Store all emotions for reference
      } catch (error) {
        console.error('Failed to fetch emotion history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmotionHistory();
  }, [user, timeRange, selectedEmotion, selectedVolume, selectedSource]);

  // Handle emotions update from child components
  const handleEmotionsUpdate = useCallback(async (updatedEmotions: Emotion[]) => {
    if (!user) return;

    try {
      // Update emotions in the backend
      await Promise.all(
        updatedEmotions.map(emotion =>
          emotionMappingsApi.updateEmotionMapping(user.userId, emotion.id, emotion)
        )
      );

      setEmotions(updatedEmotions);
    } catch (error) {
      console.error('Failed to update emotions:', error);
    }
  }, [user]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <DynamicMoodBoard
      ref={moodBoardRef}
      selectedEmotion={selectedEmotion}
      timeRange={timeRange}
      selectedVolume={selectedVolume}
      selectedSource={selectedSource}
      onEmotionsUpdate={handleEmotionsUpdate}
    />
  );
};

export default MoodboardPage;