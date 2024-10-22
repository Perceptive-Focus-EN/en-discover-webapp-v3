import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { logger } from '../../../../utils/ErrorHandling/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Pagination support
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const connections = await usersCollection.find(
      { userId: { $in: user.connections } },
      {
        projection: { userId: 1, firstName: 1, lastName: 1, avatarUrl: 1 },
        skip: offset,
        limit
      }
    ).toArray();

    res.status(200).json({ connections });
  } catch (error) {
    logger.error(new Error('Error fetching connections'), { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}
