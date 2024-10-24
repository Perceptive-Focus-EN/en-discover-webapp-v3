import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
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
    throw monitoringManager.error.createError(
      'system',
      'DATABASE_CONNECTION_FAILED',
      'Database is not initialized'
    );
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

  let client: MongoClient | undefined;
  let db: Db | undefined;

  try {
    const result = await getCosmosClient(undefined, true);
    client = result.client;
    db = result.db;

    if (!client || !db) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Failed to initialize Cosmos client or database'
      );
    }

    ensureDbInitialized(db);

    const decodedToken = verifyAccessToken(token) as DecodedToken | null;
    if (!decodedToken || !decodedToken.userId) {
      const appError = monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user) {
      const appError = monitoringManager.error.createError(
        'business',
        'USER_NOT_FOUND',
        'User not found',
        { userId: decodedToken.userId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
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

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'connection',
      'requests_fetch',
      receivedRequests.length + sentRequests.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        receivedCount: receivedRequests.length,
        sentCount: sentRequests.length
      }
    );

    return res.status(200).json({ receivedRequests, sentRequests });

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitoringManager.error.createError(
      'system',
      'DATABASE_OPERATION_FAILED',
      'Error fetching connection requests',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'connection',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'fetchConnectionRequests',
        errorType: error.name || 'unknown'
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}