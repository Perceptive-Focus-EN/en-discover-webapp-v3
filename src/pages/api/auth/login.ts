// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { Collection, WithId } from 'mongodb';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { AuthResponse, LoginRequest } from '../../../types/Login/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { ROLES } from '@/constants/AccessKey/AccountRoles/index';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, SecurityError, BusinessError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface LoginContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: LoginContext = {
  component: 'LoginHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

export default async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse | { error: string }>
) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'login_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { 
        requestId,
        path: req.url 
      }
    );

    monitoringManager.logger.info('Login attempt initiated', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        requestId,
        path: req.url,
        method: req.method
      }
    });

    if (req.method !== 'POST') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
    }

    const { email, password } = req.body as LoginRequest;
    if (!email || !password) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Email and password are required',
        { 
          missingFields: {
            email: !email,
            password: !password
          }
        }
      );
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<User>>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<WithId<Tenant>>;

    const user = await usersCollection.findOne({ email });
    if (!user) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'invalid_credentials',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { 
          requestId,
          reason: 'user_not_found' 
        }
      );

      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_INVALID_CREDENTIALS,
        'Invalid credentials'
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      monitoringManager.metrics.recordMetric(
        MetricCategory.SECURITY,
        'auth',
        'invalid_credentials',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { 
          requestId,
          userId: user.userId,
          reason: 'invalid_password' 
        }
      );

      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_INVALID_CREDENTIALS,
        'Invalid credentials'
      );
    }

    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: user.currentTenantId,
      title: user.title,
    });

    const refreshToken = generateRefreshToken();
    const sessionId = crypto.randomUUID(); // Generate unique session ID

    const tenantInfo = await tenantsCollection.findOne({ tenantId: user.currentTenantId });
    
        // Construct user info
    const extendedUserInfo: ExtendedUserInfo = {
      ...user,
      tenant: tenantInfo ? {
        tenantId: tenantInfo.tenantId,
        name: tenantInfo.name,
        domain: tenantInfo.domain,
        email: tenantInfo.email,
        industry: tenantInfo.industry,
        type: tenantInfo.type,
        isActive: tenantInfo.isActive,
        createdAt: tenantInfo.createdAt,
        updatedAt: tenantInfo.updatedAt,
        ownerId: tenantInfo.ownerId,
        users: tenantInfo.users,
        usersCount: tenantInfo.usersCount,
        parentTenantId: tenantInfo.parentTenantId,
        details: tenantInfo.details,
        resourceUsage: tenantInfo.resourceUsage,
        resourceLimit: tenantInfo.resourceLimit,
        isDeleted: tenantInfo.isDeleted,
        pendingUserRequests: tenantInfo.pendingUserRequests
      } : null,
      softDelete: false,
      reminderSent: false,
      reminderSentAt: '',
      role: ROLES.Personal.SELF,
    };

    // Update user's last login and session info
    await usersCollection.updateOne(
      { userId: user.userId },
      { 
        $set: { 
          lastLogin: new Date().toISOString(),
          sessionId,
          refreshToken
        } 
      }
    );

    const authResponse: AuthResponse = {
      success: true,
      message: 'User logged in successfully',
      user: extendedUserInfo,
      accessToken,
      refreshToken,
      sessionId,
      onboardingComplete: user.onboardingStatus.isOnboardingComplete
    };

    monitoringManager.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'login_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { 
        userId: user.userId,
        requestId,
        duration: Date.now() - startTime
      }
    );

    monitoringManager.logger.info('Login successful', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: {
        userId: user.userId,
        requestId,
        duration: Date.now() - startTime
      }
    });

    return res.status(200).json(authResponse);

  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'login_error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        requestId,
        duration: Date.now() - startTime
      }
    );

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Login process failed',
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