import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { generateAccessToken, generateRefreshToken } from '../../../utils/TokenManagement/serverTokenUtils';
import { Collection, WithId } from 'mongodb';
import { User, ExtendedUserInfo } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { AuthResponse, LoginRequest } from '../../../types/Login/interfaces';
import { logger } from '../../../utils/ErrorHandling/logger';
import { COLLECTIONS } from '../../../constants/collections';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import {ROLES, AllRoles} from '@/constants/AccessKey/AccountRoles/index';

export default async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse | { error: string }>
) {
  logger.info('Login handler invoked');
  logger.debug('Request body:', req.body);

  if (req.method !== 'POST') {
    logger.warn(`Invalid request method: ${req.method}`);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body as LoginRequest;
  if (!email || !password) {
    logger.warn('Email or password missing in request body');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    logger.info('Connecting to Cosmos DB');
    const { db } = await getCosmosClient();
    logger.info('Connected to Cosmos DB successfully');

    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<User>>;
    const tenantsCollection = db.collection(COLLECTIONS.TENANTS) as Collection<WithId<Tenant>>;

    logger.info(`Searching for user with email: ${email}`);
    const user = await usersCollection.findOne({ email });
    if (!user) {
      logger.warn(`User not found for email: ${email}`);
      return res.status(400).json({ error: 'User not found' });
    }
    logger.info('User found');

    logger.info('Comparing passwords');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Invalid password');
      return res.status(400).json({ error: 'Invalid password' });
    }
    logger.info('Password is valid');

    logger.info('Generating access and refresh tokens');
    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email,
      tenantId: user.currentTenantId,
      title: user.title,
    });
    const refreshToken = generateRefreshToken();
    logger.info('Tokens generated successfully');

    logger.info(`Fetching tenant info for tenant ID: ${user.currentTenantId}`);
    const tenantInfo = await tenantsCollection.findOne({ tenantId: user.currentTenantId });
    logger.info('Tenant info fetched');

    logger.info('Constructing extended user info');
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
    logger.info('Extended user info constructed');

    logger.info('Updating last login timestamp');
    await usersCollection.updateOne(
      { userId: user.userId },
      { $set: { lastLogin: new Date().toISOString() } }
    );
    logger.info('Last login timestamp updated');

    const authResponse: AuthResponse = {
      success: true,
      message: 'User logged in successfully',
      user: extendedUserInfo,
      accessToken: accessToken,
      refreshToken: refreshToken,
      sessionId: '',
      onboardingComplete: user.onboardingStatus.isOnboardingComplete
    };

    logger.info(`User logged in successfully: ${user.email}`);
    res.status(200).json(authResponse);
  } catch (error) {
    logger.error('Login error:', error);
    logger.debug('Error details:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}