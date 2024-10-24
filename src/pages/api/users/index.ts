import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { UpdateUserInfoRequest, User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { BusinessError, SystemError } from '@/MonitoringSystem/constants/errors';

async function updateUserInfoHandler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedUserInfo | { error: string; reference?: string }>
) {
  if (req.method !== 'PUT') {
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

  const decodedToken = (req as any).user;

  try {
    const updatedInfo = req.body as UpdateUserInfoRequest;
    const client = await getCosmosClient();
    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ userId: decodedToken.userId }) as User | null;
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

    const updatedUser: User = {
      ...user,
      ...updatedInfo,
      updatedAt: new Date().toISOString()
    };

    const result = await usersCollection.findOneAndUpdate(
      { userId: decodedToken.userId },
      { $set: updatedUser },
      { returnDocument: 'after' }
    );

    if (!result || !result.value) {
      const appError = monitoringManager.error.createError(
        'business',
        'UPDATE_FAILED',
        'Failed to update user',
        { userId: decodedToken.userId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const extendedUserInfo: ExtendedUserInfo = {
      ...result.value,
      tenant: null,
      softDelete: null,
      reminderSent: false,
      reminderSentAt: '',
      userTypes: []
    };

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'user',
      'update',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        updatedFields: Object.keys(updatedInfo)
      }
    );

    // Log success
    monitoringManager.logger.info('User info updated successfully', {
      type: BusinessError.USER_NOT_FOUND,
      userId: decodedToken.userId,
      updatedFields: Object.keys(updatedInfo)
    });

    return res.status(200).json(extendedUserInfo);

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      'DATABASE_OPERATION_FAILED',
      'Error updating user info',
      {
        userId: decodedToken.userId,
        error
      }
    );

    const errorResponse = monitoringManager.error.handleError(appError);

    // Record error metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'database',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'updateUser',
        userId: decodedToken.userId,
        errorType: error.name || 'unknown'
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default authMiddleware(updateUserInfoHandler);