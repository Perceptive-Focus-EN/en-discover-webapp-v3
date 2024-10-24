import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { TenantInfo } from '../../../types/Tenant/interfaces';
import { ROLES } from '@/constants/AccessKey/AccountRoles/index';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function switchTenantHandler(req: NextApiRequest, res: NextApiResponse) {
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

  const decodedToken = (req as any).user;

  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Tenant ID is required'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const updatedUser = await usersCollection.findOneAndUpdate(
      { userId: decodedToken.userId, tenants: tenantId },
      { $set: { currentTenantId: tenantId, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    ) as User | null;

    if (!updatedUser) {
      const appError = monitoringManager.error.createError(
        'business',
        'TENANT_ACCESS_DENIED',
        'User not found or not associated with this tenant',
        { userId: decodedToken.userId, tenantId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const tenantInfo = await tenantsCollection.findOne({ tenantId }) as TenantInfo | null;

    const extendedUserInfo: ExtendedUserInfo = {
      ...updatedUser,
      tenant: tenantInfo,
      softDelete: null,
      reminderSent: false,
      reminderSentAt: '',
      profile: updatedUser.profile || {},
      connections: updatedUser.connections || [],
      connectionRequests: updatedUser.connectionRequests || { sent: [], received: [] },
      privacySettings: updatedUser.privacySettings || { profileVisibility: 'public' },
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      role: ROLES.Business.CHIEF_EXECUTIVE_OFFICER
    };

    // Record success metric
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant',
      'switch',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        fromTenantId: updatedUser.currentTenantId,
        toTenantId: tenantId,
        success: true
      }
    );

    return res.status(200).json({ 
      message: 'Tenant switched successfully', 
      user: extendedUserInfo 
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
      'Error switching tenant',
      { error, userId: decodedToken.userId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'tenant',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'switch',
        errorType: error.name || 'unknown',
        userId: decodedToken.userId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default authMiddleware(switchTenantHandler);