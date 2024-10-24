import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient, closeCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '@/constants/collections';
import { generateUniqueUserId } from '@/utils/utils';
import { Db, ClientSession, MongoClient } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';

interface DecodedToken {
  userId: string;
  [key: string]: any;
}

interface User {
  userId: string;
  tenants: string[];
  tenantRoles: Record<string, string>;
  [key: string]: any;
}

interface SubTenant {
  tenantId: string;
  name: string;
  parentTenantId: string;
  ownerId: string;
  users: string[];
  createdAt: string;
  updatedAt: string;
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
  const startTime = Date.now();
  const requestId = generateUniqueUserId();

  let client: MongoClient | undefined;
  let db: Db | undefined;
  let session: ClientSession | undefined;

  try {
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

    const result = await getCosmosClient(undefined, true);
    client = result.client;
    db = result.db;
    ensureDbInitialized(db);
    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Failed to initialize database client'
      );
    }
    session = client.startSession();

    await session.withTransaction(async () => {
      const decodedToken = verifyAccessToken(token) as DecodedToken | null;
      if (!decodedToken) {
        throw monitoringManager.error.createError(
          'security',
          'AUTH_TOKEN_INVALID',
          'Invalid token'
        );
      }

      const { parentTenantId, subTenantName, ...subTenantData } = req.body;

      // Record attempt metric
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'tenant',
        'subtenant_creation_attempt',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          parentTenantId,
          requestId
        }
      );

      ensureDbInitialized(db);
      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
      const usersCollection = db.collection(COLLECTIONS.USERS);

      const parentTenant = await tenantsCollection.findOne({ tenantId: parentTenantId }, { session });
      if (!parentTenant) {
        throw monitoringManager.error.createError(
          'business',
          'TENANT_NOT_FOUND',
          'Parent tenant not found',
          { parentTenantId }
        );
      }

      const user = await usersCollection.findOne({ userId: decodedToken.userId }, { session }) as User | null;
      if (!user) {
        throw monitoringManager.error.createError(
          'business',
          'USER_NOT_FOUND',
          'User not found',
          { userId: decodedToken.userId }
        );
      }

      if (!user.tenants.includes(parentTenantId) || user.tenantRoles[parentTenantId] !== 'OWNER') {
        throw monitoringManager.error.createError(
          'security',
          'AUTH_UNAUTHORIZED',
          'User does not have permission to create sub-tenant',
          { userId: user.userId, parentTenantId }
        );
      }

      const existingSubTenant = await tenantsCollection.findOne({ name: subTenantName, parentTenantId }, { session });
      if (existingSubTenant) {
        throw monitoringManager.error.createError(
          'business',
          'TENANT_EXISTS',
          'A sub-tenant with this name already exists under the parent tenant',
          { subTenantName, parentTenantId }
        );
      }

      const newSubTenantId = generateUniqueUserId();
      const newSubTenant: SubTenant = {
        tenantId: newSubTenantId,
        name: subTenantName,
        parentTenantId,
        ownerId: user.userId,
        users: [user.userId],
        ...subTenantData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await tenantsCollection.insertOne(newSubTenant, { session });

      await usersCollection.updateOne(
        { userId: user.userId },
        { 
          $addToSet: { tenants: newSubTenantId },
          $set: { 
            [`tenantRoles.${newSubTenantId}`]: 'OWNER',
            updatedAt: new Date().toISOString()
          }
        },
        { session }
      );

      // Record success metrics
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'tenant',
        'subtenant_created',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          parentTenantId,
          subTenantId: newSubTenantId,
          requestId
        }
      );

      return res.status(201).json({
        message: 'New sub-tenant created successfully',
        subTenantId: newSubTenantId
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
      'TENANT_CREATION_FAILED',
      'Error creating new sub-tenant',
      { error, requestId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'tenant',
      'creation_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        operation: 'create_subtenant',
        errorType: error instanceof Error ? error.name : 'unknown',
        requestId
      }
    );

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });

  } finally {
    if (session) {
      const cleanupStart = Date.now();
      await session.endSession();
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'database',
        'cleanup_time',
        Date.now() - cleanupStart,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS
      );
    }

    if (client) {
      await closeCosmosClient();
    }

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'api',
      'total_duration',
      Date.now() - startTime,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      {
        status: res.statusCode.toString(),
        requestId
      }
    );
  }
}