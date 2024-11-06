// src/types/User/interfaces.tsx

import { AllRoles } from "@/constants/AccessKey/AccountRoles/index";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { PersonalPermission } from "@/constants/AccessKey/permissions/personal";
import { SocialPermission } from "@/constants/socialMediaPermissions";
import { UserAccountType, UserAccountTypeEnum, Subscription_Type } from "@/constants/AccessKey/accounts";
import { OnboardingStage } from "../Onboarding/types";
import { Tenant } from '../Tenant/interfaces';
import { Permissions} from "../../constants/AccessKey/permissions";

// Helper type for tenant relationship queries
export type TenantQueries = {
  getCurrentTenant(): string;
  getPersonalTenant(): string;
  getTenantRole(tenantId: string): AllRoles | undefined;
  getTenantPermissions(tenantId: string): Permissions[];
  hasActiveTenantAssociation(tenantId: string): boolean;
};

// Represents a user's relationship with a specific tenant
export interface TenantAssociation {
  tenantId: string;
  role: AllRoles;
  accessLevel: AccessLevel;
  permissions: Permissions[];
  accountType: UserAccountType;
  joinedAt: string;
  lastActiveAt: string;
  status: 'active' | 'suspended' | 'pending';
  statusUpdatedAt: string;
  statusReason?: string;
}

// Bidirectional Lookup:
// From User: user.tenants.associations[tenantId]
// From Tenant: tenant.members.active.find(m => m.userId === userId)

// Personal Tenant Tracking:
// const isPersonalTenant = user.tenants.context.personalTenantId === tenantId;


// Current Context:
// const currentTenantId = user.tenants.context.currentTenantId;
// const currentRole = user.tenants.associations[currentTenantId].role;

export interface TenantContext {
  personalTenantId: string;      // The user's own tenant ID (created at signup)
  currentTenantId: string;       // Currently active tenant context
}

// Combines core tenant IDs with their rich metadata
export interface UserTenantRelationship {
  context: TenantContext;        // Core tenant IDs
  associations: {                // Rich metadata for each tenant relationship
    [tenantId: string]: TenantAssociation  // Keyed by tenantId for efficient lookup
  };
}

export interface UserProfile {
  dob?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
}

export interface OnboardingStatusDetails {
  isOnboardingComplete: boolean;
  steps: Array<{ 
    name: string; 
    completed: boolean;
    completedAt?: string;
  }>;
  lastUpdated: string;
  currentStepIndex: number;
  stage: OnboardingStage;
}

export interface SocialProfile {
  connections: {
    active: string[];
    pending: string[];
    blocked: string[];
  };
  connectionRequests: {
    sent: Array<{
      userId: string;
      sentAt: string;
      status: 'pending' | 'accepted' | 'rejected';
    }>;
    received: Array<{
      userId: string;
      receivedAt: string;
      status: 'pending' | 'accepted' | 'rejected';
    }>;
  };
  privacySettings: {
    profileVisibility: 'public' | 'connections' | 'private';
    connectionVisibility: 'public' | 'connections' | 'private';
    activityVisibility: 'public' | 'connections' | 'private';
  };
}

// Updated BaseUser to include the new tenant context

// Updated BaseUser
export interface BaseUser {
  userId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  
  // Tenant relationship data
  tenants: UserTenantRelationship;
  
  // Account Status
  accountType: UserAccountType;
  subscriptionType: Subscription_Type;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  nfcId?: string;
  department: string;
  
  // Status Tracking
  onboardingStatus: OnboardingStatusDetails;
}

export interface User extends BaseUser {
  profile: UserProfile;
  socialProfile: SocialProfile;
}

export interface UserConnection {
  userId: string;
  connectedUserId: string;
  tenantId: string;
  connectionType: 'direct' | 'tenant';
  status: 'pending' | 'accepted' | 'blocked';
  permissions: PersonalPermission[];
  createdAt: string;
  updatedAt: string;
  lastInteractionAt: string;
}

// Simplified ExtendedUserInfo
export interface ExtendedUserInfo extends User {
  currentTenant?: Tenant; // Optional current tenant details
}


export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  profile?: Partial<UserProfile>;
  privacySettings?: Partial<SocialProfile['privacySettings']>;
  department?: string;
  isActive?: boolean;
}

// Utility type for tenant operations
export type UserTenantOperation = {
  switchTenant: (tenantId: string) => Promise<void>;
  getCurrentTenantRole: () => AllRoles;
  getCurrentTenantPermissions: () => Permissions[];
  isPersonalTenant: (tenantId: string) => boolean;
};