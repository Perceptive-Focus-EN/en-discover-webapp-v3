import { NextApiRequest, NextApiResponse } from 'next';
import { AuthResponse } from '../../../types/Login/interfaces';
import { Collection, WithId } from 'mongodb';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { Tenant, TenantInfo } from '../../../types/Tenant/interfaces';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { logger } from '../../../utils/ErrorHandling/logger';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { getCosmosClient } from '@/config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { ROLES } from '@/constants/AccessKey/AccountRoles';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const decodedToken = (req as any).user as DecodedToken;

    const client = await getCosmosClient();
    logger.info('Connected to Cosmos DB');

    const db = client.db;
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<User>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<Tenant>;

    const user = await usersCollection.findOne({ userId: decodedToken.userId }) as WithId<User> | null;
    if (!user) {
      logger.warn(`User not found: ${decodedToken.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User found: ${user.email}`);

    if (user.isDeleted) {
      logger.warn(`Deleted user attempting access: ${user.userId}`);
      return res.status(401).json({ error: 'Unauthorized: User account has been deleted' });
    }

    const tenantAssociations = user.tenantAssociations || [];

    const currentTenantAssociation = tenantAssociations.find(ta => ta.tenantId === user.currentTenantId);

    if (!currentTenantAssociation) {
      logger.warn(`Current tenant not found for user: ${user.userId}`);
      // Set personal tenant as current if no current tenant is found
      user.currentTenantId = user.personalTenantId;
    }

    const currentTenant = await tenantsCollection.findOne({ tenantId: user.currentTenantId }) as WithId<Tenant> | null;

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
    logger.info(`Access token generated for user: ${user.email}`);

    const refreshToken = generateRefreshToken();

    const loginResponse: AuthResponse = {
      success: true,
      message: 'User session restored successfully',
      user: userInfo,
      accessToken,
      refreshToken,
      sessionId: refreshToken,
      onboardingComplete: user.onboardingStatus.isOnboardingComplete,
    };
    
    logger.info(`Me handler successful for user: ${user.email}`);
    res.status(200).json(loginResponse);
  } catch (error) {
    logger.error('Error in me handler:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: `Internal server error: ${error.message}` });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default authMiddleware(meHandler);