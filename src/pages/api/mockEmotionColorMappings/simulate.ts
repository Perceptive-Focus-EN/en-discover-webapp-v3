// pages/api/mockEmotionColorMappings/simulate.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getMockData, saveMockData } from './index';
import mockEmotions from '../../../components/EN/mockEmotions';
import { EmotionName } from '../../../components/Feed/types/Reaction';

export interface Emotion {
  id: number;
  emotionName: EmotionName;
  color: string;
  volume: number;
  sources: string[];
  timestamp: string;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface EmotionMapping {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  emotions: Emotion[];
}

interface MockData {
  emotionMappings: EmotionMapping[];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, startDate, endDate } = req.body;
  const mockData = getMockData() as MockData;

  let userMappingIndex: number = mockData.emotionMappings.findIndex((mapping: EmotionMapping) => mapping.userId === userId);
  
  if (userMappingIndex === -1) {
    mockData.emotionMappings.push({
      _id: Date.now().toString(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      emotions: []
    });
    userMappingIndex = mockData.emotionMappings.length - 1;
  }

  const simulatedEmotions: Emotion[] = mockEmotions
    .filter((emotion) => {
      const emotionDate = emotion.timestamp ? new Date(emotion.timestamp) : new Date();
      return emotionDate >= new Date(startDate) && emotionDate <= new Date(endDate);
    })
    .map((emotion, index) => ({
      ...emotion,
      id: mockData.emotionMappings[userMappingIndex].emotions.length + index + 1,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      timestamp: emotion.timestamp ? new Date(emotion.timestamp).toISOString() : new Date().toISOString(),
      sources: Array.isArray(emotion.sources) ? emotion.sources : [emotion.sources].filter(Boolean),
      volume: emotion.volume ?? 0,
    }));

  mockData.emotionMappings[userMappingIndex].emotions = [
    ...mockData.emotionMappings[userMappingIndex].emotions,
    ...simulatedEmotions
  ];

  mockData.emotionMappings[userMappingIndex].updatedAt = new Date().toISOString();

  saveMockData(mockData);

  res.status(200).json({ success: true, data: simulatedEmotions });
}