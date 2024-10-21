// src/pages/api/users/link-accounts.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { logger } from '../../../utils/ErrorHandling/logger';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { TenantInfo } from '../../../types/Tenant/interfaces';
import { ROLES, AllRoles } from '@/constants/AccessKey/AccountRoles';
import { MongoClient, Db } from 'mongodb';

async function linkAccountsHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const decodedToken = (req as any).user;

  let client: MongoClient;
  let db: Db;
  try {
    const cosmosClient = await getCosmosClient();
    if (!cosmosClient.client || !cosmosClient.db) {
      throw new Error('Cosmos client or database is undefined');
    }
    client = cosmosClient.client;
    db = cosmosClient.db;
  } catch (error) {
    logger.error('Database connection error:', error);
    return res.status(500).json({ error: 'Unable to connect to the database' });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const { accountToLinkId } = req.body;

      if (!accountToLinkId) {
        throw new Error('Account ID to link is required');
      }

      const usersCollection = db.collection(COLLECTIONS.USERS);
      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);

      const [currentUser, accountToLink] = await Promise.all([
        usersCollection.findOne({ userId: decodedToken.userId }, { session }) as Promise<User | null>,
        usersCollection.findOne({ userId: accountToLinkId }, { session }) as Promise<User | null>
      ]);

      if (!currentUser || !accountToLink) {
        throw new Error('One or both users not found');
      }

      // Merge tenants and roles
      const mergedTenants = [...new Set([...currentUser.tenants, ...accountToLink.tenants])];
      const mergedTenantAssociations = [...currentUser.tenantAssociations, ...accountToLink.tenantAssociations];

      // Update current user with merged data
      const updatedUser = await usersCollection.findOneAndUpdate(
        { userId: currentUser.userId },
        { 
          $set: { 
            tenants: mergedTenants,
            tenantAssociations: mergedTenantAssociations,
            updatedAt: new Date().toISOString()
          }
        },
        { returnDocument: 'after', session }
      ) as User | null;

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      // Mark the linked account
      await usersCollection.updateOne(
        { userId: accountToLink.userId },
        { 
          $set: { 
            isLinked: true,
            linkedTo: currentUser.userId,
            updatedAt: new Date().toISOString()
          }
        },
        { session }
      );

      const tenantInfo = await tenantsCollection.findOne({ tenantId: updatedUser.currentTenantId }, { session }) as TenantInfo | null;

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
        role: ROLES.Business.CHIEF_EXECUTIVE_OFFICER
      };

      logger.info(`User ${currentUser.userId} linked account ${accountToLink.userId}`);
      res.status(200).json({ message: 'Accounts linked successfully', user: extendedUserInfo });
    });
  } catch (error) {
    logger.error('Error linking accounts:', error);
    res.status(error instanceof Error && error.message === 'Account ID to link is required' ? 400 :
               error instanceof Error && error.message === 'One or both users not found' ? 404 :
               error instanceof Error && error.message === 'Failed to update user' ? 500 :
               500)
      .json({ error: error instanceof Error ? error.message : 'Internal server error' });
  } finally {
    await session.endSession();
    if (client) {
      await client.close();
    }
  }
}

export default authMiddleware(linkAccountsHandler);
