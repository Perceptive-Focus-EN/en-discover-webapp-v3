import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { generateUniqueUserId, hashPassword } from '../../../../utils/utils';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { User, ExtendedUserInfo } from '@/types/User/interfaces';
import { Db, MongoClient, ClientSession } from 'mongodb';
import { validateUser } from '../../../../validation/validation';
import { AllRoles, ROLES } from '@/constants/AccessKey/AccountRoles';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { Subscription_TypeEnum, UserAccountType, UserAccountTypeEnum } from '../../../../constants/AccessKey/accounts';
import { BaseTenant } from '@/types/Tenant/interfaces';
import { BusinessIndustryRoles } from '@/constants/AccessKey/AccountRoles/business-roles';
// import { OnboardingStatusDetails } from '@/types/Onboarding/interfaces';

interface TenantUserCreateResponse {
  message: string;
  user: Partial<ExtendedUserInfo> | null;
}

interface DecodedToken {
  tenantId: string;
  userId: string;
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
  res: NextApiResponse<TenantUserCreateResponse>
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
    const result = await getCosmosClient(undefined, true);
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
      const userData = validateUser(req.body);
      
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
  onboardingStatus: {
    steps: [],
    isOnboardingComplete: false,
    lastUpdated: '',
    currentStepIndex: 0,
    stage: 'initial'
  },
  ...userData,
  userId: newUserId,
  password: hashedPassword,
  tenantId: adminTenantId,
  tenants: [adminTenantId],
  currentTenantId: adminTenantId,
  tenantAssociations: [{
    tenantId: adminTenantId,
    role: userData.role as AllRoles || 'defaultRole', // Replace 'defaultRole' with an appropriate default value
    accessLevel: AccessLevel[userData.accessLevel as keyof typeof AccessLevel] ?? AccessLevel.L4,
    accountType: UserAccountTypeEnum.BUSINESS as UserAccountType,
    permissions: [], // Add appropriate permissions if needed
    tenant: {} as BaseTenant // Add tenant details if needed
  }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isActive: true,
  connections: [],
  connectionRequests: { sent: [], received: [] },
  profile: {},
  privacySettings: { profileVisibility: 'public' },
  tenant: null,
  softDelete: null,
  role: userData.role as AllRoles || ROLES.Business.VIEWER,
  accountType: UserAccountTypeEnum.BUSINESS,
  permissions: [],
  subscriptionType: Subscription_TypeEnum.TRIAL,
  isVerified: false,
  personalTenantId: '',
  department: '',
  lastLogin: '',
  isDeleted: false,
  title: BusinessIndustryRoles.CHIEF_EXECUTIVE_OFFICER,
  accessLevel: AccessLevel[userData.accessLevel as keyof typeof AccessLevel] ?? AccessLevel.L4 // Ensure accessLevel is always set
};

      const result = await usersCollection.insertOne(newUser as any, { session });

      if (!result.insertedId) {
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
          requestId
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
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        accessLevel: newUser.accessLevel,
        tenantId: newUser.tenantId,
        department: newUser.department,
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