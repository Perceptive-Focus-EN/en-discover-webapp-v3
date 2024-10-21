// src/pages/api/users/[userId]/emotionMappings.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { COLLECTIONS } from '../../../../constants/collections';
import { Emotion } from '../../../../components/EN/types/emotions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decodedToken = verifyAccessToken(token);
  if (!decodedToken || decodedToken.userId !== userId) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  const { db } = await getCosmosClient();
  const collection = db.collection(COLLECTIONS.MOODBOARD);

  try {
    switch (req.method) {
      case 'GET':
        const userMappings = await collection.findOne({ userId: userId });
        console.log('User mappings:', userMappings);
        return res.status(200).json({
          success: true,
          message: "Request Was Successful",
          data: userMappings?.emotions || []
        });
      
      case 'PUT':
        const { emotions } = req.body as { emotions: Emotion[] };
        const now = new Date();
        const updatedEmotions = emotions.map(emotion => ({
          ...emotion,
          updatedAt: now,
          createdAt: emotion.createdAt || now,
          deletedAt: emotion.deletedAt || null
        }));

        const updateResult = await collection.updateOne(
          { userId: userId },
          {
            $set: {
              emotions: updatedEmotions,
              updatedAt: now
            },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true }
        );

        if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0) {
          logger.info(`Emotion mappings updated for user ${userId}`);
          return res.status(200).json({
            success: true,
            message: "Emotion mappings updated successfully",
            data: updatedEmotions
          });
        } else {
          logger.warn(`Failed to update emotion mappings for user ${userId}`);
          return res.status(400).json({ error: 'Failed to update emotion mappings' });
        }

      case 'POST':
        const { emotion } = req.body as { emotion: Omit<Emotion, 'id' | 'createdAt' | 'updatedAt'> };
        const newEmotion = {
          ...emotion,
          id: Date.now(), // Simple way to generate a unique id
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const addResult = await collection.updateOne(
          { userId: userId },
          { $set: { [`emotions.${newEmotion.id}`]: newEmotion } }
        );

        if (addResult.modifiedCount > 0) {
          logger.info(`New emotion added for user ${userId}`);
          return res.status(201).json({
            success: true,
            message: "New emotion added successfully",
            data: newEmotion
          });
        } else {
          logger.warn(`Failed to add new emotion for user ${userId}`);
          return res.status(400).json({ error: 'Failed to add new emotion' });
        }

      case 'PATCH':
        const { id, update } = req.body as { id: number, update: Partial<Emotion> };
        const updateOneResult = await collection.updateOne(
          { userId: userId },
          { $set: { [`emotions.${id}`]: { ...update, updatedAt: new Date().toISOString() } } }
        );

        if (updateOneResult.modifiedCount > 0) {
          logger.info(`Emotion updated for user ${userId}`);
          return res.status(200).json({
            success: true,
            message: "Emotion updated successfully",
          });
        } else {
          logger.warn(`Failed to update emotion for user ${userId}`);
          return res.status(400).json({ error: 'Failed to update emotion' });
        }

      case 'DELETE':
        const { emotionId } = req.body as { emotionId: number };
        const deleteResult = await collection.updateOne(
          { userId: userId },
          { $unset: { [`emotions.${emotionId}`]: "" } }
        );

        if (deleteResult.modifiedCount > 0) {
          logger.info(`Emotion deleted for user ${userId}`);
          return res.status(200).json({
            success: true,
            message: "Emotion deleted successfully",
          });
        } else {
          logger.warn(`Failed to delete emotion for user ${userId}`);
          return res.status(400).json({ error: 'Failed to delete emotion' });
        }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    logger.error('Error in emotion-mappings API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}