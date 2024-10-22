// src/pages/api/moodboard/saveMoodEntry.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { logger } from '../../../utils/ErrorHandling/logger';
import { DatabaseError } from '../../../errors/errors';
import { verifyAccessToken, isTokenBlacklisted } from '../../../utils/TokenManagement/serverTokenUtils';
import { MoodEntry } from '../../../components/EN/types/moodHistory';

const SKIP_AUTH_IN_DEV = false; // Set this to false to enable authentication in development

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logger.info('Received request to save mood entry');

  if (req.method === 'POST') {
    const isDevelopment = process.env.NODE_ENV === 'development';

    let userId = 'CandyUserId';
    if (!isDevelopment || !SKIP_AUTH_IN_DEV) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) {
        logger.warn('No token provided in request');
        return res.status(401).json({ error: 'No token provided' });
      }
      try {
        logger.info('Verifying access token');
        const decodedToken = verifyAccessToken(token);
        if (!decodedToken) {
          logger.warn('Invalid token provided');
          return res.status(401).json({ error: 'Invalid token' });
        }
        if (!decodedToken.userId) {
          logger.warn('Token does not contain a valid user ID');
          return res.status(401).json({ error: 'Token does not contain a valid user ID' });
        }
        logger.info('Checking if token is blacklisted');
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
          logger.warn('Token has been revoked');
          return res.status(401).json({ error: 'Token has been revoked' });
        }
        userId = decodedToken.userId;
      } catch (error) {
        logger.error(new Error('Error during authentication'), { error });
        return res.status(500).json({ error: 'Error during authentication' });
      }
    }

    try {
      logger.info('Extracting mood entry data from request body');
      const { emotionId, color, volume, sources, date, tenantId } = req.body as Omit<MoodEntry, '_id' | 'userId' | 'timeStamp' | 'createdAt' | 'updatedAt'>;
      if (!emotionId || !color || !volume || !sources || !date || !tenantId) {
        logger.warn('Missing required fields in request body', { emotionId, color, volume, sources, date, tenantId });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      logger.info('Getting Cosmos DB client');
      const { db } = await getCosmosClient();
      const collection = db.collection(COLLECTIONS.MOODENTRY);

      // Format date to YYYY-MM-DD for grouping
      const formattedDate = new Date(date).toISOString().split('T')[0];

      const newMoodEntry = {
        emotionId,
        color,
        volume,
        sources,
        timeStamp: new Date().toISOString(),
      };

      logger.info('Upserting mood entry into aggregated document');
      const result = await collection.updateOne(
        {
          userId,
          tenantId,
          date: formattedDate
        },
        {
          $setOnInsert: {
            createdAt: new Date().toISOString(),
          },
          $set: {
            updatedAt: new Date().toISOString(),
          },
          $push: {
            entries: newMoodEntry
          } as any // Type assertion to avoid TypeScript error
        },
        { upsert: true }
      );

      logger.info('Mood entry saved successfully', { result });
      res.status(201).json({ 
        message: 'Mood entry saved successfully', 
        result: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount,
          upsertedId: result.upsertedId
        }
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        logger.error(new Error('Database error when saving mood entry'), { error });
        res.status(500).json({ error: 'Database error when saving mood entry' });
      } else {
        logger.error(new Error('Unexpected error when saving mood entry'), { error });
        res.status(500).json({ error: 'Unexpected error when saving mood entry' });
      }
    }
  } else {
    logger.warn(`Received unsupported HTTP method: ${req.method}`);
    res.setHeader('Allow', ['POST']);
    res.status(405).send(`Method ${req.method} Not Allowed`);
  }
}