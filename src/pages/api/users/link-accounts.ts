import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { TenantInfo } from '../../../types/Tenant/interfaces';
import { ROLES } from '@/constants/AccessKey/AccountRoles';
import { MongoClient, Db } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function linkAccountsHandler(req: NextApiRequest, res: NextApiResponse) {
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
  let client: MongoClient | null = null;
  let db: Db;
  let session: any;

  try {
    const cosmosClient = await getCosmosClient();
    if (!cosmosClient.client || !cosmosClient.db) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Database connection failed'
      );
    }
    client = cosmosClient.client;
    db = cosmosClient.db;
    session = client.startSession();

    await session.withTransaction(async () => {
      const { accountToLinkId } = req.body;

      if (!accountToLinkId) {
        throw monitoringManager.error.createError(
          'business',
          'VALIDATION_FAILED',
          'Account ID to link is required'
        );
      }

      const usersCollection = db.collection(COLLECTIONS.USERS);
      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

      // Record attempt metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'account',
        'link_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          userId: decodedToken.userId,
          targetAccountId: accountToLinkId
        }
      );

      const [currentUser, accountToLink] = await Promise.all([
        usersCollection.findOne({ userId: decodedToken.userId }, { session }) as Promise<User | null>,
        usersCollection.findOne({ userId: accountToLinkId }, { session }) as Promise<User | null>
      ]);

      if (!currentUser || !accountToLink) {
        throw monitoringManager.error.createError(
          'business',
          'USER_NOT_FOUND',
          'One or both users not found',
          { userId: decodedToken.userId, targetAccountId: accountToLinkId }
        );
      }

      // Record tenant merge metrics
      const initialTenantCount = currentUser.tenants.length;
      const mergedTenants = [...new Set([...currentUser.tenants, ...accountToLink.tenants])];
      const mergedTenantAssociations = [...currentUser.tenantAssociations, ...accountToLink.tenantAssociations];

      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'account',
        'tenants_merged',
        mergedTenants.length - initialTenantCount,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          userId: decodedToken.userId,
          targetAccountId: accountToLinkId
        }
      );

      const updatedUser = await usersCollection.findOneAndUpdate(
        { userId: currentUser.userId },
        { 
          $set: { 
            tenants: mergedTenants,
            tenantAssociations: mergedTenantAssociations,
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: 'after', session }
      ) as User | null;

      if (!updatedUser) {
        throw monitoringManager.error.createError(
          'system',
          'DATABASE_OPERATION_FAILED',
          'Failed to update user'
        );
      }

      await usersCollection.updateOne(
        { userId: accountToLink.userId },
        { 
          $set: { 
            isLinked: true,
            linkedTo: currentUser.userId,
            updatedAt: new Date().toISOString()
          }
        },
        { session }
      );

      const tenantInfo = await tenantsCollection.findOne(
        { tenantId: updatedUser.currentTenantId },
        { session }
      ) as TenantInfo | null;

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
        role: ROLES.Business.CHIEF_EXECUTIVE_OFFICER
      };

      // Record success metrics
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'account',
        'link_success',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          userId: decodedToken.userId,
          targetAccountId: accountToLinkId,
          mergedTenantCount: mergedTenants.length,
          tenantAssociationsCount: mergedTenantAssociations.length
        }
      );

      return res.status(200).json({
        message: 'Accounts linked successfully',
        user: extendedUserInfo
      });
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
      'OPERATION_FAILED',
      'Error linking accounts',
      { error, userId: decodedToken.userId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'account',
      'link_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'link',
        errorType: error.name || 'unknown',
        userId: decodedToken.userId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });

  } finally {
    if (session) {
      await session.endSession();
    }
    if (client) {
      await client.close();
    }
  }
}

export default authMiddleware(linkAccountsHandler);