import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { Db, MongoClient } from 'mongodb';

interface DecodedToken {
  userId: string;
  [key: string]: any;
}

interface UserConnectionInfo {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

function ensureDbInitialized(db: Db | undefined): asserts db is Db {
  if (!db) {
    throw new Error('Database is not initialized');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let client: MongoClient | undefined;
  let db: Db | undefined;

  try {
    const result = await getCosmosClient(undefined, true);
    client = result.client;
    db = result.db;

    if (!client || !db) {
      throw new Error('Failed to initialize Cosmos client or database');
    }

    ensureDbInitialized(db);

    const decodedToken = verifyAccessToken(token) as DecodedToken | null;
    if (!decodedToken || !decodedToken.userId) {
      throw new Error('Invalid token');
    }

    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user) {
      throw new Error('User not found');
    }

    const [receivedRequests, sentRequests] = await Promise.all([
      usersCollection.find<UserConnectionInfo>(
        { userId: { $in: user.connectionRequests.received } },
        { projection: { userId: 1, firstName: 1, lastName: 1, avatarUrl: 1 } }
      ).toArray(),
      usersCollection.find<UserConnectionInfo>(
        { userId: { $in: user.connectionRequests.sent } },
        { projection: { userId: 1, firstName: 1, lastName: 1, avatarUrl: 1 } }
      ).toArray()
    ]);

    res.status(200).json({ receivedRequests, sentRequests });
  } catch (error) {
    logger.error('Error fetching connection requests:', error);
    res.status(
      error instanceof Error && error.message === 'Invalid token' ? 401 :
      error instanceof Error && error.message === 'User not found' ? 404 :
      error instanceof Error && error.message === 'Database is not initialized' ? 500 :
      500
    ).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
}