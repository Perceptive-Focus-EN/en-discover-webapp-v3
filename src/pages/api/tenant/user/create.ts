import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { generateUniqueUserId, hashPassword } from '../../../../utils/utils';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { User, ExtendedUserInfo, UserTenantRelationship } from '@/types/User/interfaces';
import { Db, MongoClient, ClientSession } from 'mongodb';
import { validateUser } from '../../../../validation/validation';
import { AllRoles, ROLES } from '@/constants/AccessKey/AccountRoles';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { Subscription_TypeEnum, UserAccountType, UserAccountTypeEnum } from '../../../../constants/AccessKey/accounts';
import { DecodedToken } from '../../../../utils/TokenManagement/clientTokenUtils';


function ensureDbInitialized(db: Db | undefined): asserts db is Db {
  if (!db) {
    throw monitoringManager.error.createError(
      'system',
      'DATABASE_CONNECTION_FAILED',
      'Database is not initialized'
    );
  }
}

async function validateAndDecodeToken(authorization: string | undefined): Promise<DecodedToken> {
  const authStart = Date.now();
  
  try {
    if (!authorization) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'No token provided'
      );
    }

    const token = authorization.split(' ')[1];
    const decodedToken = verifyAccessToken(token) as DecodedToken | null;

    if (!decodedToken?.tenantId || !decodedToken?.userId) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_TOKEN_INVALID',
        'Invalid token or missing information'
      );
    }

    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'auth',
      'duration',
      Date.now() - authStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS,
      { success: true }
    );

    return decodedToken;
  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'auth',
      'failure',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { error: error instanceof Error ? error.message : 'unknown' }
    );
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        message: errorResponse.userMessage,
        user: null
      });
    }

    // Database connection
    const dbConnectStart = Date.now();
    const result = await getCosmosClient();
    client = result.client;
    db = result.db;
    
    monitoringManager.metrics.recordMetric(
      MetricCategory.PERFORMANCE,
      'database',
      'connection_time',
      Date.now() - dbConnectStart,
      MetricType.HISTOGRAM,
      MetricUnit.MILLISECONDS
    );

    ensureDbInitialized(db);
    if (!client) {
      throw monitoringManager.error.createError(
        'system',
        'DATABASE_CONNECTION_FAILED',
        'Failed to initialize database client'
      );
    }
    session = client.startSession();

    if (!db) {
      throw new Error('Database is not initialized');
    }

    await session.withTransaction(async () => {
      // Auth validation
      const decodedToken = await validateAndDecodeToken(req.headers.authorization);
      const { tenantId: adminTenantId, userId: adminUserId } = decodedToken;

      // User validation
      const validationStart = Date.now();
      const userData = validateUser(req.body) as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: string;
        accessLevel?: string;
        tenantId: string;
      };
      
      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'validation',
        'duration',
        Date.now() - validationStart,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS
      );

      // Check admin permissions
      ensureDbInitialized(db);
      const usersCollection = db.collection<User>(COLLECTIONS.USERS);
      const adminUser = await usersCollection.findOne(
        { userId: adminUserId, tenantId: adminTenantId },
        { session }
      );

      if (!adminUser) {
        throw monitoringManager.error.createError(
          'security',
          'AUTH_UNAUTHORIZED',
          'You do not have permission to create users'
        );
      }

      // Check existing user
      const existingUser = await usersCollection.findOne(
        { email: userData.email },
        { session }
      );

      if (existingUser) {
        throw monitoringManager.error.createError(
          'business',
          'USER_EXISTS',
          'User with this email already exists',
          { email: userData.email }
        );
      }

      // Create user
      const createStart = Date.now();
      const hashedPassword = await hashPassword(userData.password);
      const newUserId = generateUniqueUserId();

      const newUser: ExtendedUserInfo = {
  socialProfile: {
    connections: {
      active: [],
      pending: [],
      blocked: []
    },
    connectionRequests: {
      sent: [],
      received: []
    },
    privacySettings: {
      profileVisibility: 'public',
      connectionVisibility: 'public',
      activityVisibility: 'public'
    }
  },
  onboardingStatus: {
    steps: [],
    isOnboardingComplete: false,
    lastUpdated: new Date().toISOString(),
    currentStepIndex: 0,
    stage: 'initial'
  },
  ...userData,
  userId: newUserId,
  email: userData.email,
  password: hashedPassword,
  firstName: userData.firstName,
  lastName: userData.lastName,
  tenants: {
    associations: {
      [userData.tenantId]: {
        tenantId: userData.tenantId,
        role: userData.role as AllRoles || 'defaultRole',
        accessLevel: AccessLevel[userData.accessLevel as keyof typeof AccessLevel] || AccessLevel.L4,
        accountType: UserAccountTypeEnum.BUSINESS,
        permissions: [],  // Define default permissions or add logic to fetch them
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'active',
        statusUpdatedAt: new Date().toISOString()
      }
    },
    context: {
      personalTenantId: '',  // Optional initialization; adjust as needed
      currentTenantId: userData.tenantId  // Ensure tenant context is accurately assigned
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true,
  profile: {},
  accountType: UserAccountTypeEnum.BUSINESS,
  subscriptionType: Subscription_TypeEnum.TRIAL,
  isVerified: false,
  department: '',
  lastLogin: '',
  isDeleted: false
};
      const insertResult = await usersCollection.insertOne(newUser as any, { session });

      if (!insertResult.insertedId) {
        throw monitoringManager.error.createError(
          'system',
          'DATABASE_OPERATION_FAILED',
          'Failed to create user'
        );
      }

      // Update tenant
      ensureDbInitialized(db);
      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
      await tenantsCollection.updateOne(
        { tenantId: adminTenantId },
        {
          $inc: { usersCount: 1 },
          $addToSet: { users: newUserId },
          $set: { updatedAt: new Date().toISOString() }
        },
        { session }
      );

      // Record success metrics
      monitoringManager.metrics.recordMetric(
        MetricCategory.BUSINESS,
        'user',
        'created',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        {
          tenantId: adminTenantId,
          userRole: userData.role,
          requestId: requestId
        }
      );

      monitoringManager.metrics.recordMetric(
        MetricCategory.PERFORMANCE,
        'user',
        'creation_time',
        Date.now() - createStart,
        MetricType.HISTOGRAM,
        MetricUnit.MILLISECONDS,
        {
          tenantId: adminTenantId,
          requestId
        }
      );

      const userInfo: Partial<ExtendedUserInfo> = {
        userId: newUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatarUrl: '',
        tenants: newUser.tenants,
        accountType: newUser.accountType,
        subscriptionType: newUser.subscriptionType,
        isActive: newUser.isActive,
        isVerified: newUser.isVerified,
        isDeleted: newUser.isDeleted,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        lastLogin: newUser.lastLogin,
        department: newUser.department,
        onboardingStatus: newUser.onboardingStatus
      };

      return res.status(201).json({
        message: 'User created successfully under tenant',
        user: userInfo
      });
    });

  } catch (error) {
    if (AppError.isAppError(error)) {
      const errorResponse = monitoringManager.error.handleError(error);
      return res.status(errorResponse.statusCode).json({
        message: errorResponse.userMessage,
        user: null
      });
    }

    const appError = monitoringManager.error.createError(
      'system',
      'USER_CREATION_FAILED',
      'Error creating tenant user',
      { error, requestId }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'user',
      'creation_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        errorType: error instanceof Error ? error.name : 'unknown',
        requestId
      }
    );

    return res.status(errorResponse.statusCode).json({
      message: errorResponse.userMessage,
      user: null
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