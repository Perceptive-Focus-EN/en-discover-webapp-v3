// src/pages/api/tenant/user/create-sub-tenant.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient, closeCosmosClient } from '../../../config/azureCosmosClient';
import { verifyAccessToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { COLLECTIONS } from '@/constants/collections';
import { generateUniqueUserId } from '@/utils/utils';
import { Db, ClientSession, MongoClient } from 'mongodb';
import { logger } from '../../../utils/ErrorHandling/logger';

interface DecodedToken {
  userId: string;
  // Add other properties that should be in the decoded token
}

interface User {
  userId: string;
  tenants: string[];
  tenantRoles: Record<string, string>;
  // Add other user properties
}

interface SubTenant {
  tenantId: string;
  name: string;
  parentTenantId: string;
  ownerId: string;
  users: string[];
  createdAt: string;
  updatedAt: string;
  // Add other sub-tenant properties
}

function ensureDbInitialized(db: Db | undefined): asserts db is Db {
  if (!db) {
    throw new Error('Database is not initialized');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let client: MongoClient | undefined;
  let db: Db | undefined;
  let session: ClientSession | undefined;

  try {
    const result = await getCosmosClient(undefined, true);
    client = result.client;
    db = result.db;

    if (!client || !db) {
      throw new Error('Failed to initialize Cosmos client or database');
    }

    session = client.startSession();

    await session.withTransaction(async () => {
      ensureDbInitialized(db);

      const decodedToken = verifyAccessToken(token) as DecodedToken | null;
      if (!decodedToken) {
        throw new Error('Invalid token');
      }

      const { parentTenantId, subTenantName, ...subTenantData } = req.body as {
        parentTenantId: string;
        subTenantName: string;
        [key: string]: any;
      };

      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
      const usersCollection = db.collection(COLLECTIONS.USERS);

      const parentTenant = await tenantsCollection.findOne({ tenantId: parentTenantId }, { session });
      if (!parentTenant) {
        throw new Error('Parent tenant not found');
      }

      const user = await usersCollection.findOne({ userId: decodedToken.userId }, { session }) as User | null;
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.tenants.includes(parentTenantId) || user.tenantRoles[parentTenantId] !== 'OWNER') {
        throw new Error('User does not have permission to create sub-tenant');
      }

      const existingSubTenant = await tenantsCollection.findOne({ name: subTenantName, parentTenantId }, { session });
      if (existingSubTenant) {
        throw new Error('A sub-tenant with this name already exists under the parent tenant');
      }

      const newSubTenantId = generateUniqueUserId();
      const newSubTenant: SubTenant = {
        tenantId: newSubTenantId,
        name: subTenantName,
        parentTenantId,
        ownerId: user.userId,
        users: [user.userId],
        ...subTenantData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await tenantsCollection.insertOne(newSubTenant, { session });

      await usersCollection.updateOne(
        { userId: user.userId },
        { 
          $addToSet: { tenants: newSubTenantId },
          $set: { 
            [`tenantRoles.${newSubTenantId}`]: 'OWNER',
            updatedAt: new Date().toISOString()
          }
        },
        { session }
      );

      res.status(201).json({ message: 'New sub-tenant created successfully', subTenantId: newSubTenantId });
    });
  } catch (error) {
    logger.error('Error creating new sub-tenant:', error);
    res.status(
      error instanceof Error && error.message === 'Invalid token' ? 401 :
      error instanceof Error && error.message === 'Parent tenant not found' ? 404 :
      error instanceof Error && error.message === 'User not found' ? 404 :
      error instanceof Error && error.message === 'User does not have permission to create sub-tenant' ? 403 :
      error instanceof Error && error.message === 'A sub-tenant with this name already exists under the parent tenant' ? 409 :
      error instanceof Error && error.message === 'Database is not initialized' ? 500 :
      500
    ).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  } finally {
    if (session) {
      await session.endSession();
    }
    if (client) {
      await client.close();
    }
  }
}