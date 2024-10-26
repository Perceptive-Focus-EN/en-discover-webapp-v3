// src/pages/moodboard.tsx
import { NextPage } from 'next';
import { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CircularProgress } from '@mui/material';
import { EmotionName } from '@/components/Feed/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import { Emotion } from '@/components/EN/mockData/emotionHistory'; // Updated import path
import { MoodBoardRef } from '@/components/EN/MoodBoard';
import { 
  mockEmotionHistory,
  generateHistoryForPeriod
} from '@/components/EN/mockData/emotionHistory';

// Dynamically import the MoodBoard component
const DynamicMoodBoard = dynamic(
  () => import('@/components/EN/MoodBoard'),
  { 
    loading: () => <CircularProgress />,
    ssr: false
  }
);

const MoodboardPage: NextPage = () => {
  // Core states
  const [emotions, setEmotions] = useState<Emotion[]>(mockEmotionHistory);
  const [historyData, setHistoryData] = useState(mockEmotionHistory);
  const moodBoardRef = useRef<MoodBoardRef>(null);

  // Filter states
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedVolume, setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Update history data when timeRange changes
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    let entriesCount: number;
    let startYear: number = currentYear;

    switch (timeRange) {
      case 'day':
        entriesCount = 24;
        break;
      case 'week':
        entriesCount = 7 * 8; // 7 days * 8 emotions types
        break;
      case 'month':
        entriesCount = 31 * 4; // 31 days * 4 entries per day
        break;
      case 'year':
        entriesCount = 365;
        break;
      case 'lifetime':
        startYear = currentYear - 5;
        entriesCount = 200;
        break;
      default:
        entriesCount = 50;
    }

    // Generate new mock data for the selected time range
    const newEmotions = generateHistoryForPeriod(startYear, currentYear, entriesCount);
    setHistoryData(newEmotions);
  }, [timeRange]);

  // Handle emotions update
  const handleEmotionsUpdate = useCallback((updatedEmotions: Emotion[]) => {
    setEmotions(updatedEmotions);
  }, []);

  return (
    <DynamicMoodBoard
      ref={moodBoardRef}
      selectedEmotion={selectedEmotion}
      timeRange={timeRange}
      selectedVolume={selectedVolume}
      selectedSource={selectedSource}
      onEmotionsUpdate={handleEmotionsUpdate}
      emotions={emotions}
      history={historyData}
    />
  );
};

export default MoodboardPage;