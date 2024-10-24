import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken, isTokenBlacklisted } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { Db } from 'mongodb';

interface DecodedToken {
  userId: string;
  [key: string]: any;
}

function ensureDbInitialized(db: Db | undefined): asserts db is Db {
  if (!db) {
    throw monitoringManager.error.createError(
      'system',
      'DATABASE_CONNECTION_FAILED',
      'Database is not initialized'
    );
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    const appError = monitoringManager.error.createError(
      'security',
      'AUTH_UNAUTHORIZED',
      'No token provided'
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }

  let cosmosClient;

  try {
    // Check token blacklist
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Token is blacklisted'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Initialize database
    cosmosClient = await getCosmosClient(undefined, true);
    const { db, client } = cosmosClient;
    ensureDbInitialized(db);

    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Cosmos client is not initialized'
      );
    }

    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        // Verify token
        const decodedToken = verifyAccessToken(token) as DecodedToken | null;
        if (!decodedToken || !decodedToken.userId) {
          throw monitoringManager.error.createError(
            'security',
            'AUTH_TOKEN_INVALID',
            'Invalid token'
          );
        }

        const { userId } = req.body;
        if (!userId) {
          throw monitoringManager.error.createError(
            'business',
            'VALIDATION_FAILED',
            'Missing userId in request body'
          );
        }

        const usersCollection = db.collection(COLLECTIONS.USERS);

        const [currentUser, requestingUser] = await Promise.all([
          usersCollection.findOne({ userId: decodedToken.userId }, { session }),
          usersCollection.findOne({ userId }, { session })
        ]);

        if (!currentUser || !requestingUser) {
          throw monitoringManager.error.createError(
            'business',
            'USER_NOT_FOUND',
            'One or both users not found',
            { currentUserId: decodedToken.userId, requestingUserId: userId }
          );
        }

        // Update connections
        const updatedReceived = (currentUser?.connectionRequests?.received || [])
          .filter((id: string) => id !== userId);
        const updatedSent = (requestingUser?.connectionRequests?.sent || [])
          .filter((id: string) => id !== decodedToken.userId);
              
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

        // Record success metric
        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'connection',
          'accept',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            userId: decodedToken.userId,
            targetUserId: userId
          }
        );

        res.status(200).json({ message: 'Connection request accepted' });
      });
    } finally {
      await session.endSession();
    }
  
  } catch (error) {
    // Then use AppError.isAppError
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    // Handle unexpected errors
    const appError = monitoringManager.error.createError(
      'system',
      'GENERAL',
      'Internal server error',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    // Record error metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'connection',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'acceptConnection',
        errorType: error.name || 'unknown'
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  } finally {
    if (cosmosClient?.client) {
      await closeCosmosClient();
    }
  }
}