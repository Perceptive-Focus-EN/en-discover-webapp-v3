// src/types/Signup/interfaces.ts

import { UserAccountType, UserAccountTypeEnum } from "@/constants/AccessKey/accounts";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { AllRoles } from "@/constants/AccessKey/AccountRoles";

export interface SignupRequest {
  firstName: string;
  lastName: string;
  password: string;
  mobile: string;
  email: string;
  tenantName: string;
  accountType: UserAccountType;
  isVerified: boolean;
  onboardingStage: string;
}

export interface SignupResponse {
  message: string;
  user: {
    _id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  };
  tenant: {
    tenantId: string;
    name: string;
  };
}

export interface TenantSignupData {
  name: string;
  // You can add more fields here if needed for tenant signup
}

export interface TenantUserSignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AllRoles;
  accountType: UserAccountTypeEnum;
  accessLevel: AccessLevel;
  department: string;
  // Optional fields that might be useful:
  mobile?: string;
  isVerified?: boolean;
  onboardingStage?: string;
}

// Combined interface for creating a tenant and its first user simultaneously
export interface CombinedTenantAndUserSignupData {
  tenant: TenantSignupData;
  user: TenantUserSignupData;
}

// If you need a response type specifically for tenant user signup
export interface TenantUserSignupResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AllRoles;
    tenantId: string;
    accountType: UserAccountTypeEnum;
    accessLevel: AccessLevel;
    department: string;
  };
}