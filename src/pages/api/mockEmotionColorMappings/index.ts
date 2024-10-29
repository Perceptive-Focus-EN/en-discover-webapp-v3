// pages/api/mockEmotionColorMappings/index.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { EmotionName } from '../../../feature/types/Reaction';

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

const mockDataPath = path.join(process.cwd(), 'src', 'mocks', 'mockEmotionColorMappings.json');

export const getMockData = (): { emotionMappings: EmotionMapping[] } => {
  const fileContents = fs.readFileSync(mockDataPath, 'utf8');
  return JSON.parse(fileContents);
};

export const saveMockData = (data: { emotionMappings: EmotionMapping[] }) => {
  fs.writeFileSync(mockDataPath, JSON.stringify(data, null, 2));
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, query } = req;
  const mockData = getMockData();

  switch (method) {
    case 'GET':
      const getUserId = query.userId as string;
      const userMapping = mockData.emotionMappings.find(mapping => mapping.userId === getUserId);
      res.status(200).json({ success: true, data: userMapping?.emotions || [] });
      break;

    case 'POST':
      const { userId: postUserId, emotion } = body;
      let userMappingIndex = mockData.emotionMappings.findIndex(mapping => mapping.userId === postUserId);
      const now = new Date().toISOString();
      
      if (userMappingIndex === -1) {
        mockData.emotionMappings.push({
          _id: Date.now().toString(),
          userId: postUserId,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          emotions: []
        });
        userMappingIndex = mockData.emotionMappings.length - 1;
      }

      const newEmotion: Emotion = {
        ...emotion,
        id: mockData.emotionMappings[userMappingIndex].emotions.length + 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        timestamp: emotion.timestamp || now,
      };

      mockData.emotionMappings[userMappingIndex].emotions.push(newEmotion);
      mockData.emotionMappings[userMappingIndex].updatedAt = now;
      saveMockData(mockData);
      res.status(201).json({ success: true, data: newEmotion });
      break;

    case 'PUT':
      const { emotions, userId: putUserId } = body;
      const now2 = new Date().toISOString();
      const putUserMappingIndex = mockData.emotionMappings.findIndex(mapping => mapping.userId === putUserId);
      
      if (putUserMappingIndex === -1) {
        mockData.emotionMappings.push({
          _id: Date.now().toString(),
          userId: putUserId,
          createdAt: now2,
          updatedAt: now2,
          deletedAt: null,
          emotions: emotions.map((e: Emotion) => ({...e, createdAt: now2, updatedAt: now2, deletedAt: null, timestamp: e.timestamp || now2}))
        });
      } else {
        mockData.emotionMappings[putUserMappingIndex].emotions = emotions.map((e: Emotion) => ({...e, updatedAt: now2, timestamp: e.timestamp || now2}));
        mockData.emotionMappings[putUserMappingIndex].updatedAt = now2;
      }

      saveMockData(mockData);
      res.status(200).json({ success: true, data: emotions });
      break;

    case 'PATCH':
      const patchUserId = body.userId;
      const emotionId = Number(query.id);
      const updateData = body.update;
      const now3 = new Date().toISOString();
      const patchUserMappingIndex = mockData.emotionMappings.findIndex(mapping => mapping.userId === patchUserId);
      
      if (patchUserMappingIndex !== -1) {
        const emotionIndex = mockData.emotionMappings[patchUserMappingIndex].emotions.findIndex(e => e.id === emotionId);
        if (emotionIndex !== -1) {
          mockData.emotionMappings[patchUserMappingIndex].emotions[emotionIndex] = {
            ...mockData.emotionMappings[patchUserMappingIndex].emotions[emotionIndex],
            ...updateData,
            updatedAt: now3,
            timestamp: updateData.timestamp || mockData.emotionMappings[patchUserMappingIndex].emotions[emotionIndex].timestamp
          };
          mockData.emotionMappings[patchUserMappingIndex].updatedAt = now3;
          saveMockData(mockData);
          res.status(200).json({ success: true, data: mockData.emotionMappings[patchUserMappingIndex].emotions[emotionIndex] });
        } else {
          res.status(404).json({ success: false, message: 'Emotion not found' });
        }
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
      break;

    case 'DELETE':
      const deleteUserId = body.userId;
      const deleteEmotionId = Number(query.id);
      const now4 = new Date().toISOString();
      const deleteUserMappingIndex = mockData.emotionMappings.findIndex(mapping => mapping.userId === deleteUserId);
      
      if (deleteUserMappingIndex !== -1) {
        const initialLength = mockData.emotionMappings[deleteUserMappingIndex].emotions.length;
        mockData.emotionMappings[deleteUserMappingIndex].emotions = mockData.emotionMappings[deleteUserMappingIndex].emotions.filter(e => e.id !== deleteEmotionId);
        
        if (mockData.emotionMappings[deleteUserMappingIndex].emotions.length < initialLength) {
          mockData.emotionMappings[deleteUserMappingIndex].updatedAt = now4;
          saveMockData(mockData);
          res.status(200).json({ success: true, message: 'Emotion deleted successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Emotion not found' });
        }
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}