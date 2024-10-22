// src/pages/api/users/switch-tenant.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { logger } from '../../../utils/ErrorHandling/logger';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { TenantInfo } from '../../../types/Tenant/interfaces';
import { ROLES } from '@/constants/AccessKey/AccountRoles/index';

async function switchTenantHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decodedToken = (req as any).user;

  try {
    const { tenantId } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

    const updatedUser = await usersCollection.findOneAndUpdate(
      { userId: decodedToken.userId, tenants: tenantId },
      { $set: { currentTenantId: tenantId, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    ) as User | null;

    if (!updatedUser) {
      logger.warn(`User ${decodedToken.userId} attempted to switch to non-associated tenant ${tenantId}`);
      return res.status(404).json({ error: 'User not found or not associated with this tenant' });
    }

    const tenantInfo = await tenantsCollection.findOne({ tenantId }) as TenantInfo | null;

    const extendedUserInfo: ExtendedUserInfo = {
      ...updatedUser,
      tenant: tenantInfo,
      softDelete: null,
      reminderSent: false,
      reminderSentAt: '',
      profile: updatedUser.profile || {},
      connections: updatedUser.connections || [],
      connectionRequests: updatedUser.connectionRequests || { sent: [], received: [] },
      privacySettings: updatedUser.privacySettings || { profileVisibility: 'public' },
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      role: ROLES.Business.CHIEF_EXECUTIVE_OFFICER

    };

    logger.info(`User ${decodedToken.userId} switched to tenant ${tenantId}`);
    res.status(200).json({ 
      message: 'Tenant switched successfully', 
      user: extendedUserInfo 
    });
  } catch (error) {
    logger.error(new Error('Error switching tenant'), { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware(switchTenantHandler);