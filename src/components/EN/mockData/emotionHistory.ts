// src/components/EN/mockData/emotionHistory.ts
import { Emotion } from '../types/emotions';
import { EmotionName, EmotionId, EmotionType } from '@/feature/types/Reaction';
import { VolumeLevelId } from '../constants/volume';

export function generateHistoryForPeriod(
  startYear: number,
  endYear: number,
  count: number
): Emotion[] {
  const emotions: Emotion[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const emotionType = EmotionType[Math.floor(Math.random() * EmotionType.length)];
    const timestamp = new Date(
      startYear + Math.random() * (endYear - startYear),
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28),
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60)
    );

    emotions.push({
      id: emotionType.id,
      userId: 'user-1',
      emotionName: emotionType.emotionName,
      sources: ['Work', 'Family', 'Health'].slice(0, Math.floor(Math.random() * 3) + 1),
      color: `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},1)`,
      volume: Math.floor(Math.random() * 5) as VolumeLevelId,
      timestamp,
      createdAt: timestamp.toISOString(),
      updatedAt: now.toISOString(),
      deletedAt: null
    });
  }

  return emotions.sort((a, b) => 
    (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)
  );
}