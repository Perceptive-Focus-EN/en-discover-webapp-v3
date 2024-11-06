import { NextApiRequest, NextApiResponse } from 'next';
import { getCosmosClient } from '../../../config/azureCosmosClient';
import { InitialTenantAssociation, SignupRequest, SignupResponse } from '../../../types/Signup/interfaces';
import { COLLECTIONS } from '../../../constants/collections';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { AccessLevel } from '@/constants/AccessKey/access_levels';
import { ACCOUNT_TYPES, UserAccountTypeEnum, Subscription_Type, Subscription_TypeEnum } from '@/constants/AccessKey/accounts';
import { generateUniqueUserId, hashPassword } from '../../../utils/utils';
import { isValidEmail, isStrongPassword } from '../../../validation/validation';
import { generateEmailVerificationToken, setEmailVerificationToken } from '../../../utils/emailUtils';
import { Industry, EmployeeCount, AnnualRevenue, Goals } from '@/types/Shared/enums';
import { SystemError, BusinessError, SecurityError } from '@/MonitoringSystem/constants/errors';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { LogCategory, LOG_PATTERNS } from '@/MonitoringSystem/constants/logging';
import { sendVerificationEmail } from '@/services/emailService';
import { Collection, ObjectId, WithId } from 'mongodb';
import { User } from '../../../types/User/interfaces';
import { Tenant } from '../../../types/Tenant/interfaces';
import { AuthContext, SessionInfo } from '@/types/Login/interfaces';
import { PersonalRoles } from '@/constants/AccessKey/AccountRoles/personal-roles';
import { getPermissionsForAccountTypeAndLevel } from '@/constants/AccessKey/permissions/index';
import { generateAccessToken, generateRefreshToken } from '@/utils/TokenManagement/serverTokenUtils';
import { Permissions } from '@/constants/AccessKey/permissions';

async function createPersonalTenant(
  db: any,
  userData: SignupRequest,
  userId: string
): Promise<{ tenantId: string, tenantRelationships: any }> {
  const tenantsCollection = db.collection(COLLECTIONS.TENANTS);
  const timestamp = new Date().toISOString();

    // Get proper permissions based on account type
  const userPermissions: Permissions[] = (getPermissionsForAccountTypeAndLevel(
    UserAccountTypeEnum.PERSONAL,
    AccessLevel.L4  // Highest level for personal tenant owner
  ).filter(permission => typeof permission === 'object') as unknown) as Permissions[];

    const personalTenant = {
    name: userData.tenantName,
    email: userData.email,
    industry: Industry.OTHER,
    type: UserAccountTypeEnum.PERSONAL,
    details: {
      phone: userData.phone,
      region: 'default',
      employeeCount: EmployeeCount.OneToTen,
      annualRevenue: AnnualRevenue.Other,
      goals: [Goals.Other],
    },
    settings: {
      joinRequests: {
        enabled: true,
        requireApproval: true
      },
      userLimits: {
        maxUsers: 5,
        warningThreshold: 4
      },
      security: {
        mfaRequired: false,
        sessionTimeout: 24,
        passwordPolicy: {
          minLength: 8,
          requireSpecialChars: true,
          requireNumbers: true
        }
      },
      resourceManagement: {
        quotaEnabled: true,
        quotaLimit: 1000,
        warningThreshold: 800
      }
    }
  };

  const tenantId = await generateUniqueUserId();

    const tenantAssociation: InitialTenantAssociation = {
      tenantId,
      role: PersonalRoles.SELF,
      accessLevel: AccessLevel.L4,
      accountType: UserAccountTypeEnum.PERSONAL,
      status: 'active',
      joinedAt: timestamp,
      lastActiveAt: timestamp,
      statusUpdatedAt: timestamp,
      permissions: []
    };

  const tenant: Tenant = {
    tenantId,
    ...personalTenant,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ownership: {
      currentOwnerId: userId,
      ownershipHistory: [{
        userId,
        startDate: timestamp
      }]
    },
    members: {
      active: [{
        userId,
        role: PersonalRoles.SELF,
        joinedAt: timestamp,
        status: 'active',
        statusUpdatedAt: timestamp,
        lastActiveAt: timestamp
      }],
      suspended: [],
      pending: []
    },
    membersCount: {
      active: 1,
      suspended: 0,
      pending: 0,
      total: 1
    },
    details: {
      ...personalTenant.details,
      region: 'default'
    },
    settings: personalTenant.settings,
    resourceUsage: 0,
    resourceLimit: 1000,
    isDeleted: false,
    lastActivityAt: timestamp,
    domain: `${userData.tenantName.toLowerCase().replace(/\s/g, '-')}.permas.cloud`
  };

    // Create the initial tenant relationships structure
  const tenantRelationships = {
    context: {
      personalTenantId: tenantId,
      currentTenantId: tenantId
    },
    associations: {
      [tenantId]: tenantAssociation
    }
  };


  await tenantsCollection.insertOne(tenant);

  monitoringManager.logger.info('Personal tenant created', {
    category: LogCategory.BUSINESS,
    pattern: LOG_PATTERNS.BUSINESS,
    metadata: { tenantId, userId }
  });

  return { tenantId, tenantRelationships };
}

export default async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse | { error: string }>,
  userPermissions: Permissions[]
) {
  const startTime = Date.now();
  const requestId = await generateUniqueUserId();

  try {
    monitoringManager.logger.info('Signup attempt started', {
      category: LogCategory.BUSINESS,
      pattern: LOG_PATTERNS.BUSINESS,
      metadata: { requestId }
    });

    if (req.method !== 'POST') {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Method not allowed'
      );
    }

    const signupData = req.body as SignupRequest;

    // Validate email and password
    if (!isValidEmail(signupData.email)) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Invalid email format'
      );
    }

    if (!isStrongPassword(signupData.password)) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.VALIDATION_FAILED,
        'Password does not meet security requirements'
      );
    }

    const { db } = await getCosmosClient();
    const usersCollection = db.collection(COLLECTIONS.USERS) as Collection<WithId<User>>;

    // Check existing user
    const existingUser = await usersCollection.findOne({ email: signupData.email });
    if (existingUser) {
      throw monitoringManager.error.createError(
        'business',
        BusinessError.USER_ALREADY_EXISTS,
        'User with this email already exists'
      );
    }

    // Create new user ID and hash password
    const userId = await generateUniqueUserId();
    const hashedPassword = await hashPassword(signupData.password);
    const timestamp = new Date().toISOString();

    // Create personal tenant first
    const { tenantId: personalTenantId, tenantRelationships } = await createPersonalTenant(db, signupData, userId);

    // Create new user with personal tenant
    const newUser: WithId<User> = {
      _id: new ObjectId(),
      userId,
      email: signupData.email,
      password: hashedPassword,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      tenants: tenantRelationships, // This comes from createPersonalTenant
      accountType: UserAccountTypeEnum.PERSONAL, // Always PERSONAL for initial signup
      subscriptionType: Subscription_TypeEnum.TRIAL,
      isActive: true,
      isVerified: false,
      isDeleted: false,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLogin: timestamp,
      department: signupData.department || 'default',
      onboardingStatus: {
        isOnboardingComplete: false,
        steps: [],
        lastUpdated: timestamp,
        currentStepIndex: 0,
        stage: 'initial'
      },
      profile: {
        phone: signupData.phone
      },
      socialProfile: {
        connections: { active: [], pending: [], blocked: [] },
        connectionRequests: { sent: [], received: [] },
        privacySettings: {
          profileVisibility: 'private',
          connectionVisibility: 'private',
          activityVisibility: 'private'
        }
      }
    };

    await usersCollection.insertOne(newUser);

    // Create session info
    const sessionInfo: SessionInfo = {
      accessToken: generateAccessToken({
        userId,
        email: signupData.email,
        tenantId: personalTenantId,
        role: PersonalRoles.SELF
      }),
      refreshToken: generateRefreshToken(),
      sessionId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    // Create auth context
    const authContext: AuthContext = {
      currentTenant: (await db.collection(COLLECTIONS.TENANTS).findOne({ tenantId: personalTenantId }) as unknown as Tenant) || undefined,
      tenantOperations: {
        switchTenant: async (tenantId: string) => {
          // Implementation provided by client
        },
        getCurrentTenantRole: () => PersonalRoles.SELF,
        isPersonalTenant: (tenantId: string) => tenantId === personalTenantId,
        getCurrentTenantPermissions: function (): Permissions[] {
          return userPermissions as unknown as Permissions[];
        }
      },
      tenantQueries: {
        getCurrentTenant: () => personalTenantId,
        getPersonalTenant: () => personalTenantId,
        getTenantRole: (tenantId: string) => tenantRelationships.associations[tenantId]?.role,
        getTenantPermissions: (tenantId: string) => tenantRelationships.associations[tenantId]?.permissions || [],
        hasActiveTenantAssociation: (tenantId: string) => 
          tenantRelationships.associations[tenantId]?.status === 'active'
      }
    };

    const { password: _, ...userWithoutPassword } = newUser;

    const response: SignupResponse = {
      success: true,
      message: 'Signup successful',
      user: userWithoutPassword,
      session: sessionInfo,
      context: authContext,
      onboardingComplete: false

    };
    
    // Additional monitoring
    monitoringManager.metrics.recordMetric(
      MetricCategory.SECURITY,
      'auth',
      'signup',
      1,
      MetricType.COUNTER,
      MetricUnit.COUNT,
      { accountType: signupData.accountType }
    );

    // Generate and send verification email
    const verificationToken = await generateEmailVerificationToken({ userId: newUser.userId, email: newUser.email });
    await setEmailVerificationToken(newUser.userId, verificationToken);
    await sendVerificationEmail({
      recipientEmail: newUser.email,
      recipientName: newUser.firstName
    });
  
    return res.status(201).json(response);

  } catch (error) {
    console.error(`[${requestId}] - Error in signupHandler:`, error);

    const appError = monitoringManager.error.createError(
      'system',
      SystemError.SERVER_INTERNAL_ERROR,
      'Signup process failed',
      { error, requestId, duration: Date.now() - startTime }
    );

    monitoringManager.logger.error(new Error('Signup failed'), SecurityError.AUTH_FAILED, {
      category: LogCategory.SECURITY,
      pattern: LOG_PATTERNS.SECURITY,
      metadata: { error: appError, requestId }
    });

    const errorResponse = monitoringManager.error.handleError(appError);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage
    });
  }
}