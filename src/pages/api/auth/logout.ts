import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { Collection } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

export default async function logoutHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const monitor = monitoringManager;
  const startTime = Date.now();

  try {
    // Monitor logout attempt
    monitor.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'logout_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { path: req.url }
    );

    monitor.logger.info('Logout handler invoked', {
      path: req.url,
      method: req.method
    });

    // Validate request method
    if (req.method !== 'POST') {
      throw monitor.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        'Invalid request method',
        { method: req.method }
      );
    }

    // Get and validate token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw monitor.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'No token provided'
      );
    }

    const decodedToken = verifyAccessToken(token);
    if (!decodedToken) {
      throw monitor.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token'
      );
    }

    // Get database connection
    const { db } = await getCosmosClient();
    const tokenBlacklistCollection = db.collection(COLLECTIONS.TOKEN_BLACKLIST);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Add token to blacklist
    await tokenBlacklistCollection.insertOne({
      token,
      userId: decodedToken.userId,
      createdAt: new Date(),
      expiresAt: new Date(decodedToken.exp * 1000)
    });

    // Update user's last activity
    await usersCollection.updateOne(
      { userId: decodedToken.userId },
      {
        $set: {
          lastLogout: new Date().toISOString(),
          isOnline: false
        }
      }
    );

    // Record successful logout
    monitor.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'logout_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        duration: Date.now() - startTime
      }
    );

    monitor.logger.info('Logout successful', {
      userId: decodedToken.userId,
      tokenExp: new Date(decodedToken.exp * 1000)
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitor.error.handleError(error);

      // Record logout failure
      monitor.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'auth',
        'logout_failure',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          errorType: errorResponse.errorType,
          duration: Date.now() - startTime
        }
      );

      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const appError = monitor.error.createError(
      'system',
      'AUTH_LOGOUT_FAILED',
      'Logout failed',
      { error }
    );
    const errorResponse = monitor.error.handleError(appError);

    monitor.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'logout_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        duration: Date.now() - startTime
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}