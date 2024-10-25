import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { SignupRequest, SignupResponse } from '../../../types/Signup/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { User } from '../../../types/User/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { ClientSession, Collection } from 'mongodb';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { ROLES } from '@/constants/AccessKey/AccountRoles/index';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { PERSONAL_PERMISSIONS } from '@/constants/AccessKey/permissions/personal';
import { ACCOUNT_TYPES, UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { Subscription_Type } from '@/constants/AccessKey/accounts';
import { generateUniqueUserId, hashPassword } from '../../../utils/utils';
import { isValidEmail, isStrongPassword } from '../../../validation/validation';
import { sendVerificationEmail } from '../../../services/emailService';
import { generateEmailVerificationToken, setEmailVerificationToken } from '../../../utils/emailUtils';
import { BaseEmailData } from '../../../types/email';
import { Industry } from '@/types/Shared/enums';
import { SystemError, BusinessError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';

interface SignupSystemContext {
  component: string;
  systemId: string;
  systemName: string;
  environment: 'development' | 'production' | 'staging';
}

const SYSTEM_CONTEXT: SignupSystemContext = {
  component: 'SignupHandler',
  systemId: process.env.SYSTEM_ID || 'auth-service',
  systemName: 'AuthenticationService',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development'
};

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
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    if (req.method !== 'POST') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed',
        { method: req.method }
      );
    }

    const { email, password, firstName, lastName } = req.body as SignupRequest;

    if (!email || !password || !firstName || !lastName) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'All fields are required',
        { 
          missingFields: {
            email: !email,
            password: !password,
            firstName: !firstName,
            lastName: !lastName
          }
        }
      );
    }

    if (!isValidEmail(email)) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Invalid email format',
        { email }
      );
    }

    if (!isStrongPassword(password)) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Password does not meet security requirements',
        { passwordLength: password.length }
      );
    }

    let client = await getCosmosClient();
    let session = client.client!.startSession();

    if (!session) {
      throw monitoringManager.error.createError(
        'system',
        SystemError.DATABASE_CONNECTION_FAILED,
        'Failed to start database session'
      );
    }

    try {
      await session.withTransaction(async () => {
        const db = client.db;
        const usersCollection: Collection<User> = db.collection(COLLECTIONS.USERS);
        const tenantsCollection: Collection<Tenant> = db.collection(COLLECTIONS.TENANTS);

        const existingUser = await usersCollection.findOne({ email }, { session });
        if (existingUser) {
          throw monitoringManager.error.createError(
            'business',
            BusinessError.USER_CREATE_FAILED,
            'User with this email already exists',
            { email }
          );
        }

        const userId = generateUniqueUserId();
        const { user, tenant } = createDefaultPersonalAccountSettings(userId, email, firstName, lastName);

        user.password = await hashPassword(password);

        await tenantsCollection.insertOne(tenant, { session });
        await usersCollection.insertOne(user, { session });

        const verificationToken = generateEmailVerificationToken({ userId, email });
        await setEmailVerificationToken(userId, verificationToken);

        try {
          const emailData: BaseEmailData = {
            recipientEmail: email,
            recipientName: `${firstName} ${lastName}`,
            additionalData: { verificationToken },
          };
          await sendVerificationEmail(emailData);

          monitoringManager.logger.info('Verification email sent', {
            category: LogCategory.BUSINESS,
            pattern: LOG_PATTERNS.BUSINESS,
            metadata: {
              userId,
              email,
              requestId
            }
          });
        } catch (emailError) {
          monitoringManager.logger.warn('Failed to send verification email', {
            category: LogCategory.SYSTEM,
            pattern: LOG_PATTERNS.SYSTEM,
            metadata: {
              error: emailError,
              userId,
              email,
              requestId
            }
          });
        }

        monitoringManager.metrics.recordMetric(
          MetricCategory.BUSINESS,
          'signup',
          'user_created',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            userId,
            tenantId: tenant.tenantId,
            accountType: UserAccountTypeEnum.PERSONAL,
            requestId
          }
        );

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
    } finally {
      if (session) {
        await session.endSession();
      }
    }

  } catch (error) {
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      'signup',
      'error',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      {
        error: error instanceof Error ? error.message : 'unknown',
        duration: Date.now() - startTime,
        requestId
      }
    );

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Signup process failed',
      { 
        error,
        requestId,
        duration: Date.now() - startTime
      }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
    });
  }
}