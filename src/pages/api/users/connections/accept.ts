// src/pages/api/tenant/user/accept-connection-request.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken, isTokenBlacklisted } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { Db } from 'mongodb';

interface DecodedToken {
  userId: string;
  [key: string]: any;
}

function ensureDbInitialized(db: Db | undefined): asserts db is Db {
  if (!db) {
    throw new Error('Database is not initialized');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let cosmosClient;

  try {
    cosmosClient = await getCosmosClient(undefined, true);
    const { db, client } = cosmosClient;

    ensureDbInitialized(db);

    if (!client) {
      throw new Error('Cosmos client is not initialized');
    }

    // Check if the token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('Token is blacklisted');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // Verify the token
        const decodedToken = verifyAccessToken(token) as DecodedToken | null;
        if (!decodedToken || !decodedToken.userId) {
          throw new Error('Invalid token');
        }

        const { userId } = req.body;
        if (!userId) {
          throw new Error('Missing userId in request body');
        }

        const usersCollection = db.collection(COLLECTIONS.USERS);

        const [currentUser, requestingUser] = await Promise.all([
          usersCollection.findOne({ userId: decodedToken.userId }, { session }),
          usersCollection.findOne({ userId }, { session })
        ]);

        if (!currentUser || !requestingUser) {
          throw new Error('One or both users not found');
        }

        // Fetch the current connection requests for both users
        // Manually remove the elements from the arrays
        const updatedReceived = (currentUser?.connectionRequests?.received || []).filter((id: string) => id !== userId);
        const updatedSent = (requestingUser?.connectionRequests?.sent || []).filter((id: string) => id !== decodedToken.userId);
              
        // Update the documents with the modified arrays
        await Promise.all([
          usersCollection.updateOne(
            { userId: decodedToken.userId },
            {
              $set: { 'connectionRequests.received': updatedReceived },
              $addToSet: { connections: userId }
            },
            { session }
          ),
          usersCollection.updateOne(
            { userId },
            {
              $set: { 'connectionRequests.sent': updatedSent },
              $addToSet: { connections: decodedToken.userId }
            },
            { session }
          )
        ]);
        

        // Update the users' connection status
        res.status(200).json({ message: 'Connection request accepted' });
      });
    } finally {
      await session.endSession();
    }
  
  } catch (error) {
    logger.error(new Error('Error accepting connection request'), { error });
    res.status(
      error instanceof Error && error.message === 'Invalid token' ? 401 :
      error instanceof Error && error.message === 'Missing userId in request body' ? 400 :
      error instanceof Error && error.message === 'One or both users not found' ? 404 :
      error instanceof Error && error.message === 'Database is not initialized' ? 500 :
      500
    ).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  } finally {
    if (cosmosClient?.client) {
      await closeCosmosClient();
    }
  }
}
