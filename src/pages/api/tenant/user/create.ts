// src/pages/api/tenant/user/create.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '../../../../utils/TokenManagement/serverTokenUtils';
import { generateUniqueUserId, hashPassword } from '../../../../utils/utils';
import { logger } from '../../../../utils/ErrorHandling/logger';
import { getCosmosClient, closeCosmosClient } from '../../../../config/azureCosmosClient';
import { COLLECTIONS } from '@/constants/collections';
import { User, ExtendedUserInfo } from '@/types/User/interfaces';
import { Db, MongoClient, ClientSession } from 'mongodb';
import { validateUser } from '../../../../validation/validation';
import { AllRoles, ROLES } from '@/constants/AccessKey/AccountRoles';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { BusinessIndustryRoles } from '@/constants/AccessKey/AccountRoles/business-roles';
import { Subscription_TypeEnum, UserAccountTypeEnum } from '@/constants/AccessKey/accounts';

interface TenantUserCreateResponse {
  message: string;
  user: Partial<ExtendedUserInfo> | null;
}

interface DecodedToken {
  tenantId: string;
  userId: string;
  [key: string]: any;
}

function ensureDbInitialized(db: Db | undefined): asserts db is Db {
  if (!db) {
    throw new Error('Database is not initialized');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TenantUserCreateResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed', user: null });
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

      const { authorization } = req.headers;
      if (!authorization) {
        throw new Error('Unauthorized');
      }

      const token = authorization.split(' ')[1];
      const decodedToken = verifyAccessToken(token) as DecodedToken | null;
      if (!decodedToken || !decodedToken.tenantId || !decodedToken.userId) {
        throw new Error('Invalid token or missing information');
      }

      const adminTenantId = decodedToken.tenantId;
      const adminUserId = decodedToken.userId;

      const userData = validateUser(req.body);
      const hashedPassword = await hashPassword(userData.password);

      const usersCollection = db.collection<User>(COLLECTIONS.USERS);

      const adminUser = await usersCollection.findOne(
        { userId: adminUserId, tenantId: adminTenantId },
        { session }
      );
      if (!adminUser) {
        throw new Error('You do not have permission to create users');
      }

      const existingUser = await usersCollection.findOne({ email: userData.email }, { session });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const newUserId = generateUniqueUserId();
      const newUser: ExtendedUserInfo = {
        ...userData,
        password: hashedPassword,
        accessLevel: (['L0', 'L1', 'L2', 'L3', 'L4'].includes(userData.accessLevel ?? '') ? userData.accessLevel : 'L0') as AccessLevel,
        tenantId: adminTenantId,
        permissions: [],
        isActive: true,
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: newUserId,
        onboardingStatus: {
          isOnboardingComplete: false,
          steps: [],
          lastUpdated: new Date().toISOString(),
          currentStepIndex: 0,
          stage: 'initial'
        },
        tenant: null,
        softDelete: null,
        reminderSent: false,
        reminderSentAt: '',
        tenants: [adminTenantId],
        department: '',
        lastLogin: '',
        isDeleted: false,
        avatarUrl: '',
        connections: [],
        connectionRequests: {
          sent: [],
          received: []
        },
        privacySettings: {
          profileVisibility: 'connections'
        },
        currentTenantId: adminTenantId,
        profile: {},
        personalTenantId: '',
        tenantAssociations: [],
        email: '',
        firstName: '',
        lastName: '',
        role: BusinessIndustryRoles.CHIEF_EXECUTIVE_OFFICER,
        accountType: UserAccountTypeEnum.BUSINESS,
        subscriptionType: Subscription_TypeEnum.DISCOUNTED,
        nfcId: '',
        title: BusinessIndustryRoles.CHIEF_EXECUTIVE_OFFICER
      };

      const result = await usersCollection.insertOne(newUser as any, { session });

      if (!result.insertedId) {
        throw new Error('Failed to create user');
      }

      const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
      await tenantsCollection.updateOne(
        { tenantId: adminTenantId },
        {
          $inc: { usersCount: 1 },
          $addToSet: { users: newUserId },
          $set: { updatedAt: new Date().toISOString() }
        },
        { session }
      );

      logger.info(`User created under tenant ${adminTenantId}: ${newUser.email}`);

      const userInfo: Partial<ExtendedUserInfo> = {
        userId: newUserId,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        accessLevel: newUser.accessLevel,
        tenantId: newUser.tenantId,
        department: newUser.department,
      };

      res.status(201).json({
        message: 'User created successfully under tenant',
        user: userInfo
      });
    });
  } catch (error) {
    logger.error('Error creating tenant user:', error);
    res.status(
      error instanceof Error && error.message === 'Unauthorized' ? 401 :
      error instanceof Error && error.message === 'Invalid token or missing information' ? 401 :
      error instanceof Error && error.message === 'You do not have permission to create users' ? 403 :
      error instanceof Error && error.message === 'User with this email already exists' ? 409 :
      error instanceof Error && error.message === 'Failed to create user' ? 500 :
      error instanceof Error && error.message === 'Database is not initialized' ? 500 :
      500
    ).json({ 
      message: error instanceof Error ? error.message : 'Internal server error', 
      user: null 
    });
  } finally {
    if (session) {
      await session.endSession();
    }
    if (client) {
      await client.close();
    }
  }
}