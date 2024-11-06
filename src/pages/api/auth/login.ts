import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { Collection, WithId } from 'mongodb';
import { User } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { AuthResponse, LoginRequest, SessionInfo, AuthContext } from '../../../types/Login/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, SecurityError, BusinessError } from '@/MonitoringSystem/constants/errors';
import jwt from 'jsonwebtoken';

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
    console.log(`[${requestId}] - Login attempt started.`);

    if (req.method !== 'POST') {
      console.error(`[${requestId}] - Invalid request method: ${req.method}`);
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
    }

    const { email, password } = req.body as LoginRequest;
    if (!email || !password) {
      console.error(`[${requestId}] - Missing email or password.`);
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Email and password are required',
        { missingFields: { email: !email, password: !password } }
      );
    }

    console.log(`[${requestId}] - Email and password received.`);

    const { db } = await getCosmosClient();
    if (!db) {
      console.error(`[${requestId}] - Database connection failed.`);
      throw new Error('Database connection is null');
    }

    console.log(`[${requestId}] - Database connection established.`);

    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<User>>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<WithId<Tenant>>;

    const user = await usersCollection.findOne({ email });
    if (!user || !user.isActive || user.isDeleted) {
      console.warn(`[${requestId}] - User not found or inactive for email: ${email}`);
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_INVALID_CREDENTIALS,
        'Invalid credentials or account is inactive'
      );
    }

    console.log(`[${requestId}] - User found: ${user.userId}`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`[${requestId}] - Invalid password for user: ${user.userId}`);
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_INVALID_CREDENTIALS,
        'Invalid credentials'
      );
    }

    console.log(`[${requestId}] - Password validated for user: ${user.userId}`);

    let currentTenantId = user.tenants.context.currentTenantId;

    if (currentTenantId === user.userId) {
      console.warn(`[${requestId}] - currentTenantId matches userId. Setting to personalTenantId.`);
      currentTenantId = user.tenants.context.personalTenantId;
    }

    console.log(`[${requestId}] - Current tenant ID: ${currentTenantId}`);

    const currentAssociation = user.tenants.associations[currentTenantId];
    if (!currentAssociation) {
      console.warn(`[${requestId}] - No valid tenant association found for currentTenantId: ${currentTenantId}`);
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_INVALID_CREDENTIALS,
        'Tenant association not found for this user'
      );
    }

    console.log(`[${requestId}] - Tenant association found for currentTenantId: ${currentTenantId}`);

    const currentTenant = await tenantsCollection.findOne({ tenantId: currentTenantId });
    if (!currentTenant || currentTenant.isDeleted || !currentTenant.isActive) {
      console.warn(`[${requestId}] - Tenant inactive or not found for tenantId: ${currentTenantId}`);
      throw monitoringManager.error.createError(
        'security',
        SecurityError.AUTH_INVALID_CREDENTIALS,
        'Tenant is inactive or not found'
      );
    }

    console.log(`[${requestId}] - Tenant is active and found for tenantId: ${currentTenantId}`);

    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: currentTenantId,
      role: currentAssociation.role
    });

    // Decode the token to verify the payload
    const decodedToken = jwt.decode(accessToken);
    console.log(`[${requestId}] - Decoded token payload:`, decodedToken);

    const refreshToken = generateRefreshToken();
    const sessionId = crypto.randomUUID();

    console.log(`[${requestId}] - Tokens generated for user: ${user.userId}`);

    const sessionInfo: SessionInfo = {
      accessToken,
      refreshToken,
      sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    console.log(`[${requestId}] - Session info created for user: ${user.userId}`);

    const authContext: AuthContext = {
      currentTenant,
      tenantOperations: {
        switchTenant: async (tenantId: string) => {
          // Implementation provided by client
        },
        getCurrentTenantRole: () => currentAssociation.role,
        getCurrentTenantPermissions: () => currentAssociation.permissions,
        isPersonalTenant: (tenantId: string) => tenantId === user.tenants.context.personalTenantId
      },
      tenantQueries: {
        getCurrentTenant: () => currentTenantId,
        getPersonalTenant: () => user.tenants.context.personalTenantId,
        getTenantRole: (tenantId: string) => user.tenants.associations[tenantId]?.role,
        getTenantPermissions: (tenantId: string) => user.tenants.associations[tenantId]?.permissions || [],
        hasActiveTenantAssociation: (tenantId: string) => 
          user.tenants.associations[tenantId]?.status === 'active'
      }
    };

    console.log(`[${requestId}] - Auth context created for user: ${user.userId}`);

    await usersCollection.updateOne(
      { userId: user.userId },
      { 
        $set: { 
          lastLogin: new Date().toISOString(),
          'session.id': sessionId,
          'session.refreshToken': refreshToken,
          'session.expiresAt': sessionInfo.expiresAt
        } 
      }
    );

    console.log(`[${requestId}] - User ${user.userId} login data updated.`);

    const { password: userPassword, ...userWithoutPassword } = user;

    const authResponse: AuthResponse = {
      success: true,
      message: 'User logged in successfully',
      user: userWithoutPassword,  // Use the object without password
      session: sessionInfo,
      context: authContext,
      onboardingComplete: user.onboardingStatus.isOnboardingComplete
    };

    console.log(`[${requestId}] - Login successful for user: ${user.userId}`);
    return res.status(200).json(authResponse);

  } catch (error) {
    console.error(`[${requestId}] - Error in loginHandler:`, error);

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Login process failed',
      { error, requestId, duration: Date.now() - startTime }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    console.error(`[${requestId}] - Error response generated:`, errorResponse);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage
    });
  }
}
