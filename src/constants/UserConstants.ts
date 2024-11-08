// src/constants/UserConstants.ts

import { UserAccountType, UserAccountTypeEnum, Subscription_Type } from "@/constants/AccessKey/accounts";
import { AllRoles } from "@/constants/AccessKey/AccountRoles/index";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { PersonalPermission } from "@/constants/AccessKey/permissions/personal";
import { SocialPermission } from "@/constants/socialMediaPermissions";

export const USER_FIELDS = {
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    EMAIL: 'email',
    TITLE: 'title',
    ACCOUNT_TYPE: 'accountType',
    ACCESS_LEVEL: 'accessLevel',
    PERMISSIONS: 'permissions',
    IS_ACTIVE: 'isActive',
    IS_VERIFIED: 'isVerified',
    TENANTS: 'tenants',
    ONBOARDING_STATUS: 'onboardingStatus',
    DEPARTMENT: 'department',
    DOB: 'dob',
    PHONE: 'phone',
    ADDRESS: 'address',
    CITY: 'city',
    STATE: 'state',
    ZIP: 'zip',
    COUNTRY: 'country',
    AVATAR: 'avatar',
    LAST_LOGIN: 'lastLogin',
    IS_DELETED: 'isDeleted',
    ID: 'id',
    USER_ID: 'userId',
    PASSWORD: 'password',
    AVATAR_URL: 'avatarUrl',
    NFC_ID: 'nfcId',
    SUBSCRIPTION_TYPE: 'subscriptionType',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
    TENANT_ID: 'tenantId',
    PERSONAL_TENANT_ID: 'personalTenantId',
    CURRENT_TENANT_ID: 'currentTenantId',
    TENANT_ASSOCIATIONS: 'tenantAssociations',
} as const;

export const USER_PROFILE_FIELDS = {
    DOB: 'dob',
    PHONE: 'phone',
    ADDRESS: 'address',
    CITY: 'city',
    STATE: 'state',
    ZIP: 'zip',
    COUNTRY: 'country',
    AVATAR: 'avatar',
    BIO: 'bio',
    INTERESTS: 'interests',
} as const;

export const USER_FIELDS_EXTENDED = {
    ...USER_FIELDS,
    PROFILE: 'profile',
    CONNECTIONS: 'connections',
    CONNECTION_REQUESTS: 'connectionRequests',
    PRIVACY_SETTINGS: 'privacySettings',
    PROFILE_VISIBILITY: 'profileVisibility',
    ROLE: 'role',
    USER_TYPES: 'userTypes',
    TENANT: 'tenant',
    SOFT_DELETE: 'softDelete',
    REMINDER_SENT: 'reminderSent',
    REMINDER_SENT_AT: 'reminderSentAt',
} as const;

export const USER_ACCOUNT_FIELDS = {
    TENANT_ID: 'tenantId',
    ACCOUNT_TYPE: 'accountType',
    ACCOUNT_TYPE_ENUM: 'accountTypeEnum',
    SUBSCRIPTION_TYPE: 'subscriptionType',
    ACCOUNT_NAME: 'accountName',
    ACCOUNT_ROLE: 'accountRole',
    AVATAR: 'avatar',
} as const;

export const SOCIAL_CONNECTION_FIELDS = {
    TENANT_ID: 'tenantId',
    USER_ID: 'userId',
    CONNECTED_USER_ID: 'connectedUserId',
    STATUS: 'status',
    PERMISSIONS: 'permissions',
} as const;

export const USER_CONNECTION_FIELDS = {
    ...SOCIAL_CONNECTION_FIELDS,
} as const;

export const ONBOARDING_STATUS_FIELDS = {
    IS_ONBOARDING_COMPLETE: 'isOnboardingComplete',
    STEPS: 'steps',
    NAME: 'name',
    COMPLETED: 'completed',
    LAST_UPDATED: 'lastUpdated',
    CURRENT_STEP_INDEX: 'currentStepIndex',
    STAGE: 'stage',
} as const;

export const CONNECTION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    BLOCKED: 'blocked',
} as const;

export const PROFILE_VISIBILITY = {
    PUBLIC: 'public',
    CONNECTIONS: 'connections',
    PRIVATE: 'private',
} as const;

export const ONBOARDING_STAGES = {
    INITIAL: 'initial',
    IN_PROGRESS: 'inProgress',
    COMPLETE: 'complete',
} as const;