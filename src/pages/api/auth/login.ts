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
import { 
  MetricCategory, 
  MetricType, 
  MetricUnit 
} from '@/MonitoringSystem/constants/metrics';

export default async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse | { error: string }>
) {
  const monitor = monitoringManager;
  
  try {
    // Start monitoring login attempt
    monitor.metrics.recordMetric(
      MetricCategory.BUSINESS,
      'auth',
      'login_attempt',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { path: req.url }
    );

    monitor.logger.info('Login handler invoked', { 
      path: req.url,
      method: req.method 
    });

    // Validate request method
    if (req.method !== 'POST') {
      throw monitor.error.createError(
        'business',
        'METHOD_NOT_ALLOWED',
        'Invalid request method',
        { method: req.method }
      );
    }

    // Validate request body
    const { email, password } = req.body as LoginRequest;
    if (!email || !password) {
      throw monitor.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Email and password are required'
      );
    }

    // Database connection
    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<User>>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<WithId<Tenant>>;

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      monitor.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'auth',
        'user_not_found',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { email }
      );

      throw monitor.error.createError(
        'security',
        'AUTH_INVALID_CREDENTIALS',
        'User not found',
        { email }
      );
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      monitor.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'auth',
        'invalid_password',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { email }
      );

      throw monitor.error.createError(
        'security',
        'AUTH_INVALID_CREDENTIALS',
        'Invalid password',
        { email }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: user.currentTenantId,
      title: user.title,
    });
    const refreshToken = generateRefreshToken();

    // Get tenant info
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

    // Update last login
    await usersCollection.updateOne(
      { userId: user.userId },
      { $set: { lastLogin: new Date().toISOString() } }
    );

    // Prepare response
    const authResponse: AuthResponse = {
      success: true,
      message: 'User logged in successfully',
      user: extendedUserInfo,
      accessToken,
      refreshToken,
      sessionId: '',
      onboardingComplete: user.onboardingStatus.isOnboardingComplete
    };

    // Record successful login
    monitor.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'login_success',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { 
        userId: user.userId,
        email: user.email 
      }
    );

    monitor.logger.info('Login successful', { 
      userId: user.userId,
      email: user.email 
    });

    res.status(200).json(authResponse);

  } catch (error) {
    const errorResponse = monitor.error.handleError(error);

    // Record login failure
    monitor.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'auth',
      'login_failure',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { error: errorResponse.errorType }
    );

    res.status(errorResponse.statusCode).json({ 
      error: errorResponse.userMessage 
    });
  }
}