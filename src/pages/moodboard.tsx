// pages/moodboard.tsx
import { NextPage } from 'next';
import { useRef, useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { EmotionName } from '@/feature/types/Reaction';
import { TimeRange } from '@/components/EN/types/moodHistory';
import { VolumeLevelId } from '@/components/EN/constants/volume';
import { Emotion } from '@/components/EN/types/emotions';
import { MoodBoardRef } from '@/components/EN/MoodBoard';
import { emotionMappingsApi } from '@/lib/api/reactions/emotionMappings';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalState } from '@/contexts/GlobalStateContext';

const DynamicMoodBoard = dynamic(
  () => import('@/components/EN/MoodBoard'),
  {
    loading: () => <CircularProgress />,
    ssr: false
  }
);

const MoodboardPage: NextPage = () => {
  const { user } = useAuth();
  const { currentTenant, isLoading: tenantLoading } = useGlobalState();
  const router = useRouter();
  const moodBoardRef = useRef<MoodBoardRef>(null);

  // Core states
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionName | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [selectedVolume, setSelectedVolume] = useState<VolumeLevelId | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  // Check for auth and tenant
  useEffect(() => {
    if (!loading && !tenantLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!currentTenant) {
        router.replace('/select-tenant');
      }
    }
  }, [user, currentTenant, loading, tenantLoading, router]);

  const handleEmotionsUpdate = useCallback(async (updatedEmotions: Emotion[]) => {
    if (!user) return;
    setEmotions(updatedEmotions);
  }, [user]);

  if (loading || tenantLoading || !user || !currentTenant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <CircularProgress />
      </div>
    );
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