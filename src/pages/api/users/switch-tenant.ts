import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { Collection, WithId } from 'mongodb';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { COLLECTIONS } from '../../../constants/collections';

export default async function switchTenantHandler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = monitoringManager.logger.generateRequestId();
  
  if (req.method !== 'POST') {
    console.error(`[${requestId}] - Invalid request method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decodedToken = (req as any).user;

  try {
    console.log(`[${requestId}] - Switching tenant for user: ${decodedToken.userId}`);
    
    const { tenantId } = req.body;
    if (!tenantId) {
      console.error(`[${requestId}] - No tenant ID provided`);
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<User>>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<WithId<Tenant>>;

    // Fetch user details
    const user = await usersCollection.findOne({ userId: decodedToken.userId });
    if (!user || !user.tenants.associations[tenantId]) {
      console.error(`[${requestId}] - User not found or no tenant association: ${decodedToken.userId}`);
      return res.status(403).json({ error: 'Tenant access denied or tenant not associated with user' });
    }

    // Verify tenant association and fetch tenant details
    const currentAssociation = user.tenants.associations[tenantId];
    const currentTenant = await tenantsCollection.findOne({ tenantId });

    if (!currentTenant || !currentTenant.isActive) {
      console.error(`[${requestId}] - Tenant not found or inactive: ${tenantId}`);
      return res.status(404).json({ error: 'Tenant not found or inactive' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId,
      role: currentAssociation.role,
      permissions: currentAssociation.permissions
    });

    const now = new Date().toISOString();
    const sessionId = crypto.randomUUID();
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Update user document with new tenant context and session
    await usersCollection.updateOne(
      { userId: user.userId },
      { 
        $set: { 
          'tenants.context.currentTenantId': tenantId,
          lastLogin: now,
          session: {
            id: sessionId,
            refreshToken: refreshToken,
            lastActivity: now,
            isOnline: true,
            expiresAt: expiresAt
          }
        }
      }
    );

    // Update tenant's last activity
    await tenantsCollection.updateOne(
      { tenantId },
      { 
        $set: { 
          lastActivityAt: now,
          'members.$[member].lastActiveAt': now
        }
      },
      {
        arrayFilters: [{ 'member.userId': user.userId }]
      }
    );

    console.log(`[${requestId}] - Successfully switched tenant for user: ${user.userId}`);

    // Prepare the response
    const sessionInfo = {
      accessToken,
      refreshToken,
      sessionId,
      expiresAt
    };

    const authContext = {
      currentTenant,
      tenantOperations: {
        getCurrentTenantRole: () => currentAssociation.role,
        getCurrentTenantPermissions: () => currentAssociation.permissions,
        isPersonalTenant: (tId: string) => tId === user.tenants.context.personalTenantId
      },
      tenantQueries: {
        getCurrentTenant: () => tenantId,
        getPersonalTenant: () => user.tenants.context.personalTenantId,
        getTenantRole: (tId: string) => user.tenants.associations[tId]?.role,
        getTenantPermissions: (tId: string) => user.tenants.associations[tId]?.permissions || [],
        hasActiveTenantAssociation: (tId: string) => user.tenants.associations[tId]?.status === 'active'
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Tenant switched successfully',
      user: {
        ...user,
        tenants: {
          ...user.tenants,
          context: {
            ...user.tenants.context,
            currentTenantId: tenantId
          }
        },
        session: {
          id: sessionId,
          refreshToken,
          lastActivity: now,
          isOnline: true,
          expiresAt
        }
      },
      currentTenant: {
        ...currentTenant,
        association: currentAssociation
      },
      session: sessionInfo,
      context: authContext
    });

  } catch (error) {
    console.error(`[${requestId}] - Error in switchTenantHandler:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}