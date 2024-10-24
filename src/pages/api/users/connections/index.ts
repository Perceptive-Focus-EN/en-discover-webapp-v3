import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '../../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

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

  try {
    const decodedToken = verifyAccessToken(token);
    if (!decodedToken || typeof decodedToken !== 'object' || !decodedToken.userId) {
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

    const { db } = await getCosmosClient();
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

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'connection',
      'fetch',
      connections.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        limit,
        offset,
        totalConnections: connections.length
      }
    );

    return res.status(200).json({ connections });

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
      'Error fetching connections',
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
        operation: 'fetchConnections',
        errorType: error.name || 'unknown'
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}