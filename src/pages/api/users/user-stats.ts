import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
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

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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

  const token = authHeader.split(' ')[1];
  const decodedToken = verifyAccessToken(token);
  if (!decodedToken) {
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

  const tenantId = decodedToken.tenantId;

  try {
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Record metric for stats fetch attempt
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'user_stats',
      'fetch',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { tenantId }
    );

    // Get user counts
    const [totalUsers, activeUsers, onboardingUsers] = await Promise.all([
      usersCollection.countDocuments({ tenantId }),
      usersCollection.countDocuments({ tenantId, isActive: true }),
      usersCollection.countDocuments({ tenantId, 'onboardingStatus.isOnboardingComplete': false })
    ]);

    const userGrowth = calculateUserGrowth(tenantId);

    // Record metrics for user stats
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant_users',
      'total',
      totalUsers,
      MetricType.GAUGE,
      MetricUnit.COUNT,
      { tenantId }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant_users',
      'active',
      activeUsers,
      MetricType.GAUGE,
      MetricUnit.COUNT,
      { tenantId }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant_users',
      'onboarding',
      onboardingUsers,
      MetricType.GAUGE,
      MetricUnit.COUNT,
      { tenantId }
    );

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant_users',
      'growth',
      userGrowth,
      MetricType.GAUGE,
      MetricUnit.PERCENTAGE,
      { tenantId }
    );

    return res.status(200).json({
      totalUsers,
      activeUsers,
      onboardingUsers,
      userGrowth
    });

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
      'Failed to fetch user stats',
      { error, tenantId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'user_stats',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'fetch',
        errorType: error.name || 'unknown',
        tenantId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

function calculateUserGrowth(tenantId: string): number {
  // Implement actual growth calculation logic
  return 2.5;
}