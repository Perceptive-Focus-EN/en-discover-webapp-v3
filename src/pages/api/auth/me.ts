import { NextApiRequest, NextApiResponse } from 'next';
import { AuthResponse, SessionInfo, AuthContext } from '../../../types/Login/interfaces';
import { Collection, WithId } from 'mongodb';
import { User } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { SystemError, BusinessError, SecurityError } from '@/MonitoringSystem/constants/errors';
import { DecodedToken } from '@/utils/TokenManagement/clientTokenUtils';
import crypto from 'crypto';
import { Business } from '@mui/icons-material';

async function meHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse | { error: string, reference?: string }>
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
    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<User>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<Tenant>;

    // Fetch user data
    const user = await usersCollection.findOne({ userId: decodedToken.userId }) as WithId<User> | null;
    if (!user) {
      throw monitoringManager.error.createError('business', BusinessError.USER_NOT_FOUND, 'User not found', { userId: decodedToken.userId });
    }
    if (user.isDeleted) {
      throw monitoringManager.error.createError('security', 'AUTH_UNAUTHORIZED', 'User account has been deleted', { userId: user.userId });
    }

    const { password: _, ...userWithoutPassword } = user;

    // Retrieve `currentTenantId` and validate association
    let currentTenantId = user.tenants.context.currentTenantId;

    // Ensure `currentTenantId` is correctly set and associated with the user
    if (!user.tenants.associations[currentTenantId]) {
      console.warn(`[${requestId}] - No valid tenant association for currentTenantId: ${currentTenantId}`);
      currentTenantId = user.tenants.context.personalTenantId;
    }

    const currentAssociation = user.tenants.associations[currentTenantId];
    if (!currentAssociation) {
      throw monitoringManager.error.createError(
        'security',
       BusinessError.TENANT_INVALID_DETAILS,
        'No valid tenant association found for currentTenantId',
        { userId: user.userId, tenantId: currentTenantId }
      );
    }

    // Ensure tenant is active and not deleted
    const currentTenant = await tenantsCollection.findOne({ tenantId: currentTenantId });
    if (!currentTenant || currentTenant.isDeleted || !currentTenant.isActive) {
      throw monitoringManager.error.createError(
        'security',
        SecurityError.TENANT_NOT_FOUND,
        'Tenant is inactive or not found',
        { tenantId: currentTenantId }
      );
    }

    // Generate tokens and session information
    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: currentTenantId,
      role: currentAssociation.role
    });
    const refreshToken = generateRefreshToken();
    const sessionId = crypto.randomUUID();

    const sessionInfo: SessionInfo = {
      accessToken,
      refreshToken,
      sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // Construct auth context with tenant-specific information
    const authContext: AuthContext = {
      currentTenant,
      tenantOperations: {
        switchTenant: async (tenantId: string) => {
          // Implementation for tenant switch
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
        hasActiveTenantAssociation: (tenantId: string) => user.tenants.associations[tenantId]?.status === 'active'
      }
    };

    const authResponse: AuthResponse = {
      success: true,
      message: 'User session restored successfully',
      user: userWithoutPassword,
      session: sessionInfo,
      context: authContext,
      onboardingComplete: user.onboardingStatus.isOnboardingComplete
    };

    return res.status(200).json(authResponse);

  } catch (error) {
    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Error in me handler',
      { error, requestId, duration: Date.now() - startTime }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({ 
      error: errorResponse.userMessage, 
      reference: errorResponse.errorReference 
    });
  }
}

export default authMiddleware(meHandler);
