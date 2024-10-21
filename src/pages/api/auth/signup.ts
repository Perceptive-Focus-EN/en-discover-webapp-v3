import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { SignupRequest, SignupResponse } from '../../../types/Signup/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { User } from '../../../types/User/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { ClientSession, Collection } from 'mongodb';
import { frontendLogger } from '../../../utils/ErrorHandling/frontendLogger';
import { ROLES } from '@/constants/AccessKey/AccountRoles/index';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { PERMISSIONS } from '@/constants/AccessKey/permissions';
import { PERSONAL_PERMISSIONS } from '@/constants/AccessKey/permissions/personal';
import { ACCOUNT_TYPES, UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { Subscription_Type } from '@/constants/AccessKey/accounts';
import { SYSTEM_LEVEL_ROLES } from '@/constants/AccessKey/AccountRoles/system-level-roles';
import { generateUniqueUserId, hashPassword } from '../../../utils/utils';
import { isValidEmail, isStrongPassword } from '../../../validation/validation';
import { sendVerificationEmail } from '../../../services/emailService';
import { generateEmailVerificationToken, setEmailVerificationToken } from '../../../utils/emailUtils';
import { BaseEmailData } from '../../../types/email';
import { Industry } from '@/types/Shared/enums';

class SignupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignupError';
  }
}

function createDefaultPersonalAccountSettings(userId: string, email: string, firstName: string, lastName: string): { user: User, tenant: Tenant } {
  const personalTenantId = generateUniqueUserId();
  
  const tenant: Tenant = {
    tenantId: generateUniqueUserId(),
    name: `${firstName} ${lastName}'s Personal Account`,
    email: email,

    isActive: true,
    isDeleted: false,
    ownerId: userId,
    users: [userId],
    usersCount: 1,
    type: UserAccountTypeEnum.PERSONAL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resourceUsage: 0,
    resourceLimit: 1000, // Default limit
    details: {
      region: '' // Could be populated based on signup info or IP
    },
    domain: '',
    industry: Industry.OTHER,
    pendingUserRequests: [],
  };

  const user: User = {
    userId: generateUniqueUserId(),
    email: email,
    password: '', // This will be set later with the hashed password
    firstName: firstName,
    lastName: lastName,
    personalTenantId: personalTenantId,
    currentTenantId: personalTenantId,
    tenants: [personalTenantId],
    tenantAssociations: [
      {
        tenantId: personalTenantId,
        role: ROLES.Personal.SELF,
        accessLevel: AccessLevel.L4,
        permissions: PERSONAL_PERMISSIONS.L4,
        tenant: tenant,
        accountType: UserAccountTypeEnum.PERSONAL,
      },
    ],
    isActive: true,
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
    profile: {
      dob: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      bio: '',
      interests: [],
    },
    connections: [],
    connectionRequests: {
      sent: [],
      received: []
    },
    privacySettings: {
      profileVisibility: 'public'
    },
    onboardingStatus: {
      isOnboardingComplete: false,
      steps: [],
      lastUpdated: new Date().toISOString(),
      currentStepIndex: 0,
      stage: 'initial'
    },
    department: '',
    lastLogin: new Date().toISOString(),
    accountType: UserAccountTypeEnum.PERSONAL,
    accessLevel: AccessLevel.L4,
    permissions: PERSONAL_PERMISSIONS.L4,
    subscriptionType: 'TRIAL' as Subscription_Type,
    tenantId: personalTenantId,
    title: ROLES.Personal.SELF,
  };

  return { user, tenant };
}

export default async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, firstName, lastName } = req.body as SignupRequest;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Password is not strong enough. It should be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
    });
  }

  let client: { client?: any; db: any; };
  let session: ClientSession | undefined;
  try {
    client = await getCosmosClient();
    session = client.client!.startSession();

    if (!session) {
      throw new Error('Failed to start session');
    }
    await session.withTransaction(async () => {
      const db = client.db;
      const usersCollection: Collection<User> = db.collection(COLLECTIONS.USERS);
      const tenantsCollection: Collection<Tenant> = db.collection(COLLECTIONS.TENANTS);

      const existingUser = await usersCollection.findOne({ email }, { session });
      if (existingUser) {
        throw new SignupError('User with this email already exists');
      }

      const userId = generateUniqueUserId();
      const { user, tenant } = createDefaultPersonalAccountSettings(userId, email, firstName, lastName);

      user.password = await hashPassword(password);

      await tenantsCollection.insertOne(tenant, { session });
      await usersCollection.insertOne(user, { session });

      const verificationToken = generateEmailVerificationToken({ userId, email });
      await setEmailVerificationToken(userId, verificationToken);

      const emailData: BaseEmailData = {
        recipientEmail: email,
        recipientName: `${firstName} ${lastName}`,
        additionalData: { verificationToken },
      };

      try {
        await sendVerificationEmail(emailData);
      } catch (emailError) {
        frontendLogger.error('Failed to send verification email', 'An error occurred while sending the verification email', { emailError });
      }

      const response: SignupResponse = {
        message: 'Signup successful. Please check your email to verify your account.',
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userId: user.userId || '',
          role: user.title,
          tenantId: user.tenantId,
          _id: ''
        },
        tenant: {
          name: tenant.name,
          tenantId: tenant.tenantId || ''
        },
      };

      res.status(201).json(response);
    });
  } catch (error) {
    frontendLogger.error('Signup error', 'An error occurred during the signup process', { error });
    if (error instanceof SignupError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unexpected error occurred during signup' });
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}