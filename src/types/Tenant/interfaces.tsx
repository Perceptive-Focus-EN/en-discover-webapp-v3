// src/types/Tenant/interfaces.ts

import { Industry, EmployeeCount, AnnualRevenue, Goals } from "../Shared/enums";
import { UserAccountTypeEnum } from "@/constants/AccessKey/accounts";
import { AllRoles } from "@/constants/AccessKey/AccountRoles";


// Ownership Management:

export interface TenantOwnership {
  currentOwnerId: string;
  ownershipHistory: Array<{
    userId: string;
    startDate: string;
    endDate?: string;
  }>;
}

export interface TenantDetails {
  employeeCount?: EmployeeCount;
  annualRevenue?: AnnualRevenue;
  goals?: Goals[];
  formationDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  region: string;
}

export interface TenantMember {
  userId: string;
  role: AllRoles;
  joinedAt: string;
  status: 'active' | 'suspended' | 'pending';
  statusUpdatedAt: string;
  lastActiveAt: string;
}

export interface TenantSettings {
  joinRequests: {
    enabled: boolean;
    requireApproval: boolean;
    autoExpireHours?: number;
  };
  userLimits: {
    maxUsers: number;
    warningThreshold: number;
  };
  security: {
    mfaRequired: boolean;
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
    };
  };
  resourceManagement: {
    quotaEnabled: boolean;
    quotaLimit: number;
    warningThreshold: number;
  };
}

export interface BaseTenant {
  tenantId: string;
  name: string;
  domain: string;
  email: string;
  industry: Industry;
  type: UserAccountTypeEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant extends BaseTenant {
  ownership: TenantOwnership;

  members: {
    active: TenantMember[];
    suspended: TenantMember[];
    pending: TenantMember[];
  };
  membersCount: {
    active: number;
    suspended: number;
    pending: number;
    total: number;
  };
  parentTenantId?: string;
  childTenants?: string[];
  details: TenantDetails;
  settings: TenantSettings;
  resourceUsage: number;
  resourceLimit: number;
  isDeleted: boolean;
  lastActivityAt: string;
}

export interface CreateTenantRequest {
  name: string;
  domain?: string;
  email: string;
  industry: Industry;
  type: UserAccountTypeEnum;
  details?: Partial<TenantDetails>;
  settings?: Partial<TenantSettings>;
}

export interface UpdateTenantRequest {
  name?: string;
  domain?: string;
  email?: string;
  industry?: Industry;
  details?: Partial<TenantDetails>;
  settings?: Partial<TenantSettings>;
}