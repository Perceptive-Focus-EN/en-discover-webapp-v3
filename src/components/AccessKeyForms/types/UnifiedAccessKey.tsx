import { ACCESS_LEVELS, AccessLevel } from "@/constants/AccessKey/access_levels";
import { ACCOUNT_TYPES, Subscription_Type } from "@/constants/AccessKey/accounts";
import { SYSTEM_LEVEL_ROLES } from "@/constants/AccessKey/AccountRoles/system-level-roles";
import { AllRoles } from "@/constants/AccessKey/AccountRoles/index";
import { BaseInstituteTypes, InstituteRoles, InstituteTypes } from "@/constants/AccessKey/AccountRoles/institutes-roles";


export interface UnifiedAccessKeyParams {
  USER_ID: string,
  ASSOCIATED_TENANT_ID: string;
  SYSTEM_LEVEL_ROLE: keyof typeof SYSTEM_LEVEL_ROLES;
  SUBSCRIPTION_TYPE: Subscription_Type;
  ACCOUNT_TYPE: keyof typeof ACCOUNT_TYPES;
  TITLE: AllRoles;
  ACCESS_LEVEL: AccessLevel;
  PERMISSIONS: string[];
  BASE_TYPE?: BaseInstituteTypes;
  INSTITUTE_TYPE?: InstituteTypes;
  INSTITUTE_ROLE?: keyof typeof InstituteRoles[keyof typeof InstituteRoles];
  ADDITIONAL_PERMISSIONS: string[];
  email?: string; // Add email property here
}