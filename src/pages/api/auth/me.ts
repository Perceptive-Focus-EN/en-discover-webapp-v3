import { NextApiRequest, NextApiResponse } from 'next';
import { AuthResponse } from '../../../types/Login/interfaces';
import { Collection, WithId } from 'mongodb';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { Tenant, TenantInfo } from '../../../types/Tenant/interfaces';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ROLES } from '@/constants/AccessKey/AccountRoles';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, BusinessError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface MeHandlerSystemContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: MeHandlerSystemContext = {
  component: 'MeHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

interface DecodedToken {
  userId: string;
  email: string;
  tenantId: string;
  title: string;
}

async function meHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse | { error: string }>
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    if (req.method !== 'GET') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
    }

    const decodedToken = (req as any).user as DecodedToken;

    const client = await getCosmosClient();
    monitoringManager.logger.info('Database connection established', {
      category: LogCategory.SYSTEM,
      pattern: LOG_PATTERNS.SYSTEM,
      metadata: {
        component: SYSTEM_CONTEXT.component,
        userId: decodedToken.userId
      }
    });

    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<User>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<Tenant>;

    const user = await usersCollection.findOne({ userId: decodedToken.userId }) as WithId<User> | null;
    if (!user) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.USER_NOT_FOUND,
        'User not found',
        { userId: decodedToken.userId }
      );
    }

    if (user.isDeleted) {
      throw monitoringManager.error.createError(
        'security',
        'AUTH_UNAUTHORIZED',
        'User account has been deleted',
        { userId: user.userId }
      );
    }

    const tenantAssociations = user.tenantAssociations || [];
    const currentTenantAssociation = tenantAssociations.find(ta => ta.tenantId === user.currentTenantId);

    if (!currentTenantAssociation) {
      monitoringManager.logger.warn('Current tenant not found, using personal tenant', {
        category: LogCategory.BUSINESS,
        pattern: LOG_PATTERNS.BUSINESS,
        metadata: {
          userId: user.userId,
          currentTenantId: user.currentTenantId,
          personalTenantId: user.personalTenantId
        }
      });
      user.currentTenantId = user.personalTenantId;
    }

    const currentTenant = await tenantsCollection.findOne({ tenantId: user.currentTenantId }) as WithId<Tenant> | null;

    // Build tenant info and user info...
    const tenantInfo: TenantInfo | null = currentTenant ? {
      tenantId: currentTenant.tenantId,
      name: currentTenant.name,
      domain: currentTenant.domain,
      email: currentTenant.email,
      industry: currentTenant.industry,
      type: currentTenant.type,
      isActive: currentTenant.isActive,
      createdAt: currentTenant.createdAt,
      updatedAt: currentTenant.updatedAt,
      ownerId: currentTenant.ownerId,
      users: currentTenant.users,
      usersCount: currentTenant.usersCount,
      parentTenantId: currentTenant.parentTenantId,
      details: currentTenant.details,
      resourceUsage: currentTenant.resourceUsage,
      resourceLimit: currentTenant.resourceLimit,
      isDeleted: currentTenant.isDeleted,
      pendingUserRequests: currentTenant.pendingUserRequests || []
    } : null;

    const userInfo: ExtendedUserInfo = {
      ...user,
      userId: user.userId,
      tenant: tenantInfo,
      tenantAssociations: tenantAssociations,
      profile: user.profile || {},
      connections: user.connections || [],
      connectionRequests: user.connectionRequests || { sent: [], received: [] },
      privacySettings: user.privacySettings || { profileVisibility: 'public' },
      subscriptionType: user.subscriptionType,
      softDelete: false,
      reminderSent: false,
      reminderSentAt: '',
      lastLogin: '',
      avatarUrl: '',
      nfcId: '',
      department: '',
      onboardingStatus: user.onboardingStatus,
      role: ROLES.Personal.SELF,
    };

    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: user.currentTenantId,
      role: ROLES.Personal.SELF,
    });

    const refreshToken = generateRefreshToken();

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'session_restored',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        userId: user.userId,
        tenantId: user.currentTenantId,
        duration: Date.now() - startTime,
        requestId
      }
    );

    const loginResponse: AuthResponse = {
      success: true,
      message: 'User session restored successfully',
      user: userInfo,
      accessToken,
      refreshToken,
      sessionId: refreshToken,
      onboardingComplete: user.onboardingStatus.isOnboardingComplete,
    };
    
    monitoringManager.logger.info('Session restored successfully', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        userId: user.userId,
        email: user.email,
        duration: Date.now() - startTime,
        requestId
      }
    });

    return res.status(200).json(loginResponse);

  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'session_restore_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        duration: Date.now() - startTime,
        requestId
      }
    );

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Error in me handler',
      { 
        error,
        requestId,
        duration: Date.now() - startTime
      }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}

export default authMiddleware(meHandler);