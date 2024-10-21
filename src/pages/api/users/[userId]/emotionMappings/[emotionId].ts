// src/pages/api/users/[userId]/emotionMappings/[emotionId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../../../utils/ErrorHandling/logger';
import { COLLECTIONS } from '../../../../../constants/collections';
import { EmotionId } from '../../../../../components/Feed/types/Reaction';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, emotionId } = req.query;
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
    if (req.method === 'PATCH') {
      const { color } = req.body;
      const updateResult = await collection.updateOne(
        { userId: userId },
        {
          $set: {
            [`emotionMappings.${emotionId}`]: color,
            updatedAt: new Date()
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        logger.info(`Emotion mapping updated for user ${userId}, emotion ${emotionId}`);
        return res.status(200).json({ message: 'Emotion mapping updated successfully' });
      } else {
        logger.warn(`Failed to update emotion mapping for user ${userId}, emotion ${emotionId}`);
        return res.status(404).json({ error: 'Emotion mapping not found' });
      }
    } else {
      res.setHeader('Allow', ['PATCH']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    logger.error('Error in emotion-mapping API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}