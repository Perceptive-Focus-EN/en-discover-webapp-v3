import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '@/constants/collections';

type CosmosClientType = {
  client: {
    startSession: () => any;
  };
  db: {
    collection: (name: string) => any;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let client: CosmosClientType;
  try {
    const cosmosClient = await getCosmosClient();
    if (!cosmosClient.client) {
      throw new Error('Database client is undefined');
    }
    client = cosmosClient as CosmosClientType;
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Unable to connect to the database' });
  }

  const session = client.client.startSession();

  try {
    await session.withTransaction(async () => {
      const decodedToken = verifyAccessToken(token);
      if (!decodedToken) {
        throw new Error('Invalid token');
      }

      const { tenantId, userIdToAdd, role } = req.body;

      const db = client.db;
      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
      const usersCollection = db.collection(COLLECTIONS.USERS);

      const tenant = await tenantsCollection.findOne({ tenantId }, { session });
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const currentUser = await usersCollection.findOne({ userId: decodedToken.userId }, { session });
      if (!currentUser) {
        throw new Error('Current user not found');
      }

      if (!currentUser.tenants.includes(tenantId) || currentUser.tenantRoles[tenantId] !== 'OWNER') {
        throw new Error('User does not have permission to add users to this tenant');
      }

      const userToAdd = await usersCollection.findOne({ userId: userIdToAdd }, { session });
      if (!userToAdd) {
        throw new Error('User to add not found');
      }

      await usersCollection.updateOne(
        { userId: userIdToAdd },
        { 
          $addToSet: { tenants: tenantId },
          $set: { 
            [`tenantRoles.${tenantId}`]: role,
            updatedAt: new Date().toISOString()
          }
        },
        { session }
      );

      await tenantsCollection.updateOne(
        { tenantId },
        { 
          $addToSet: { users: userIdToAdd },
          $set: { updatedAt: new Date().toISOString() } 
        },
        { session }
      );

      res.status(200).json({ message: 'User added to tenant successfully' });
    });
  } catch (error) {
    console.error('Error adding user to tenant:', error);
    res.status(error instanceof Error && error.message === 'Invalid token' ? 401 :
               error instanceof Error && error.message === 'Tenant not found' ? 404 :
               error instanceof Error && error.message === 'Current user not found' ? 404 :
               error instanceof Error && error.message === 'User does not have permission to add users to this tenant' ? 403 :
               error instanceof Error && error.message === 'User to add not found' ? 404 :
               500)
      .json({ error: error instanceof Error ? error.message : 'Internal server error' });
  } finally {
    await session.endSession();
  }
}
