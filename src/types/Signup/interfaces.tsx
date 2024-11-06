// src/types/types/Signup/interfaces.ts
import { UserAccountType, UserAccountTypeEnum } from "@/constants/AccessKey/accounts";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { AllRoles } from "@/constants/AccessKey/AccountRoles";
import { Industry } from "../Shared/enums";
import { TenantDetails, TenantSettings } from "../Tenant/interfaces";
import { User } from "../User/interfaces";
import { AuthResponse } from "../Login/interfaces";
import { Permissions } from "../../constants/AccessKey/permissions";
import { TenantAssociation } from "../User/interfaces";


// Base signup data for personal tenant creation
export interface PersonalTenantData {
  name: string;
  email: string;
  industry: Industry;
  type: UserAccountTypeEnum;
  details?: Partial<TenantDetails>;
  settings?: Partial<TenantSettings>;
}

// Base user signup data
export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  tenantName: string;
  accountType: UserAccountType;
  department?: string;
}

// Response maintains consistency with login flow
export interface SignupResponse extends Omit<AuthResponse, 'user'> {
  user: Omit<User, 'password'>;
}

export interface TenantInviteSignupRequest extends SignupRequest {
  inviteCode: string;
  tenantId: string;
}

// For creating additional tenants (not during signup)
export interface CreateTenantWithOwnerRequest {
  tenant: {
    name: string;
    email: string;
    industry: Industry;
    type: UserAccountTypeEnum;
    details?: Partial<TenantDetails>;
    settings?: Partial<TenantSettings>;
  };
  ownerUserId: string;
  role: AllRoles;
  accessLevel: AccessLevel;
}

// Internal helper type for tenant association during signup
export interface InitialTenantAssociation extends TenantAssociation {
  role: AllRoles;
  accessLevel: AccessLevel;
  accountType: UserAccountType;
  status: 'active';
  permissions: Permissions[];
  joinedAt: string;
  lastActiveAt: string;
  statusUpdatedAt: string;
}



