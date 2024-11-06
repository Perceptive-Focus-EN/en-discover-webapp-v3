import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '../../../constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { User } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

async function tenantHandler(req: NextApiRequest, res: NextApiResponse) {
  const decodedToken = (req as any).user;

  switch (req.method) {
    case 'GET':
      return await searchTenants(req, res, decodedToken);
    case 'POST':
      return await sendJoinRequest(req, res, decodedToken);
    default:
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
}

async function searchTenants(req: NextApiRequest, res: NextApiResponse, decodedToken: any) {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm) {
      const appError = monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Search term is required'
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    const { db } = await getCosmosClient();
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const tenants = await tenantsCollection.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { domain: { $regex: searchTerm, $options: 'i' } }
      ]
    }).project({
      tenantId: 1,
      name: 1,
      domain: 1,
      industry: 1,
      type: 1
    }).toArray();

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant',
      'search',
      tenants.length,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        searchTerm: String(searchTerm),
        resultsCount: tenants.length
      }
    );

    return res.status(200).json(tenants);

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
      'Error searching tenants',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'tenant',
      'search_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'search',
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

async function sendJoinRequest(req: NextApiRequest, res: NextApiResponse, decodedToken: any) {
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

    const [tenant, user] = await Promise.all([
      tenantsCollection.findOne({ tenantId }) as Promise<Tenant | null>,
      usersCollection.findOne({ userId: decodedToken.userId }) as Promise<User | null>
    ]);

    if (!tenant) {
      const appError = monitoringManager.error.createError(
        'business',
        'TENANT_NOT_FOUND',
        'Tenant not found',
        { tenantId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

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

    if (Array.isArray(user.tenants) && user.tenants.includes(tenantId) ||
      Array.isArray(user.connectionRequests.sent) && user.connectionRequests.sent.includes(tenantId)) {
      const appError = monitoringManager.error.createError(
        'business',
        'REQUEST_INVALID',
        'Already a member or request pending',
        { userId: decodedToken.userId, tenantId }
      );
      const errorResponse = monitoringManager.error.handleError(appError);
      return res.status(errorResponse.statusCode).json({
        error: errorResponse.userMessage,
        reference: errorResponse.errorReference
      });
    }

    await Promise.all([
      usersCollection.updateOne(
        { userId: decodedToken.userId },
        { $addToSet: { 'connectionRequests.sent': tenantId } }
      ),
      tenantsCollection.updateOne(
        { tenantId },
        { $addToSet: { pendingUserRequests: decodedToken.userId } }
      )
    ]);

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'tenant',
      'join_request',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: decodedToken.userId,
        tenantId,
        tenantName: tenant.name
      }
    );

    return res.status(200).json({ message: 'Join request sent successfully' });

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
      'Error sending join request',
      { error, userId: decodedToken.userId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'tenant',
      'join_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'join',
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

export default authMiddleware(tenantHandler);