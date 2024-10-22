// src/pages/api/moodHistory.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { logger } from '../../../utils/ErrorHandling/logger';
import { DatabaseError } from '../../../errors/errors';
import { verifyAccessToken, isTokenBlacklisted } from '../../../utils/TokenManagement/serverTokenUtils';
import { MoodHistoryItem, MoodHistoryQuery, TimeRange } from '../../../components/EN/types/moodHistory';
import { getStartDate } from '../../../utils/dateUtil';
import { Emotion } from '@/components/EN/types/emotions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decodedToken = verifyAccessToken(token);
      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({ error: 'Token has been revoked' });
      }

      const { emotion, timeRange } = req.query;

      if (!emotion || !timeRange || Array.isArray(emotion) || Array.isArray(timeRange)) {
        return res.status(400).json({ error: 'Invalid emotion or time range' });
      }

      if (!isValidTimeRange(timeRange)) {
        return res.status(400).json({ error: 'Invalid time range' });
      }

      const moodHistoryQuery: MoodHistoryQuery = {
        emotion: emotion as unknown as Emotion,
        timeRange: timeRange as TimeRange,
        startDate: '',
        endDate: ''
      };

      const { db } = await getCosmosClient();
      const collection = db.collection(COLLECTIONS.MOODBOARD);
      const startDate = getStartDate(moodHistoryQuery.timeRange);

      const moodHistory = await collection.find<MoodHistoryItem>({
        userId: decodedToken.userId,
        emotionName: moodHistoryQuery.emotion,
        date: { $gte: startDate }
      }).sort({ date: 1 }).toArray();

      res.status(200).json(moodHistory);
    } catch (error) {
      if (error instanceof DatabaseError) {
        logger.error(new Error('Database error when fetching mood history'), { error });
        res.status(500).json({ error: 'Database error when fetching mood history' });
      } else {
        logger.error(new Error('Unexpected error when fetching mood history'), { error });
        res.status(500).json({ error: 'Unexpected error when fetching mood history' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).send(`Method ${req.method} Not Allowed`);
  }
}

function isValidTimeRange(timeRange: string): timeRange is TimeRange {
  return ['day', 'week', 'month', 'year', 'lifetime'].includes(timeRange);
}