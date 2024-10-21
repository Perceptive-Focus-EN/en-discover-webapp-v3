// src/constants/userTemplates.ts
import { PERMISSIONS } from './AccessKey/permissions'
import { ROLES } from './AccessKey/AccountRoles';
import { UserAccountType } from './AccessKey/accounts';
import { AccessLevel } from './AccessKey/access_levels';

// COMPLETE DEFAULT OVERVIEW OF HOW I STACKED EVERYTHING TOGETHER
// THINK SANDWICH
// PROVIDE CUSTOMIZATION OF ROLES AS WELL A CUSTOM DEFAULT ROLES FOR ONBOARDING OR UNIQUE USE CASES
export const USER_TEMPLATES = {
  regularEmployee: {
    role: ROLES.Business.EMPLOYEE,
    accountType: 'BUSINESS' as UserAccountType,
    accessLevel: AccessLevel.L1,
    additionalPermissions: [] as (keyof typeof PERMISSIONS)[],
  },
  employeeWithTempSecurityAccess: {
    role: ROLES.Business.EMPLOYEE,
    accountType: 'BUSINESS' as UserAccountType,
    accessLevel: AccessLevel.L2,
    additionalPermissions: ['SECURITY_READ', 'SECURITY_UPDATE'] as (keyof typeof PERMISSIONS)[],
  },
  managerWithExtraAnalyticsAccess: {
    role: ROLES.Business.MANAGER,
    accountType: 'BUSINESS' as UserAccountType,
    accessLevel: AccessLevel.L3,
    additionalPermissions: ['ANALYTICS_CREATE', 'ANALYTICS_DELETE'] as (keyof typeof PERMISSIONS)[],
  },
  contractorWithSpecificAccess: {
    role: ROLES.Business.VIEWER,
    accountType: 'BUSINESS' as UserAccountType,
    accessLevel: AccessLevel.L1,
    additionalPermissions: [
      'RESOURCE_READ',
      'RESOURCE_UPDATE',
      'DEVOPS_READ',
      'DEVOPS_UPDATE',
    ] as (keyof typeof PERMISSIONS)[],
  },
  // New templates based on new account types
  personalUserBasic: {
    role: ROLES.Personal.USER,
    accountType: 'PERSONAL' as UserAccountType,
    accessLevel: AccessLevel.L1,
    additionalPermissions: Object.keys(PERMISSIONS.PERSONAL) as (keyof typeof PERMISSIONS)[],
  },
  familyAdministrator: {
    role: ROLES.Family.HEAD_OF_HOUSEHOLD,
    accountType: 'FAMILY' as UserAccountType,
    accessLevel: AccessLevel.L4,
    additionalPermissions: Object.keys(PERMISSIONS.FAMILY) as (keyof typeof PERMISSIONS)[],
  },
  financialAnalyst: {
    role: ROLES.Finance.ANALYST,
    accountType: 'FINANCIAL' as UserAccountType,
    accessLevel: AccessLevel.L3,
    additionalPermissions: [
      'ANALYTICS_READ',
      'ANALYTICS_CREATE',
      'INSIGHTS_READ',
      'INSIGHTS_CREATE',
    ] as (keyof typeof PERMISSIONS)[],
  },
  nonProfitVolunteer: {
    role: ROLES.NonProfit.VOLUNTEER,
    accountType: 'NON_PROFIT' as UserAccountType,
    accessLevel: AccessLevel.L1,
    additionalPermissions: [
      'RESOURCE_READ',
      'STORAGE_READ',
      'ANALYTICS_READ',
    ] as (keyof typeof PERMISSIONS)[],
  },
  // THIS WILL BE HOW WE EXPORT THE ABOVE TO BE USED THROUGH THE APPLICATION AS NEEDED
  // WE CAN CREATE AS MANY TEMPLATES AND USE THIS USER PERMISSION AS A BASE TEMPLATE
} satisfies Record<string, UserWithCustomPermissions>;

export type UserTemplateKey = keyof typeof USER_TEMPLATES;

export function getUserTemplate(key: UserTemplateKey): UserWithCustomPermissions {
  return USER_TEMPLATES[key];
}

// Updated interface to use additionalPermissions
interface UserWithCustomPermissions {
  role: string;
  accountType: UserAccountType;
  accessLevel: AccessLevel;
  additionalPermissions: (keyof typeof PERMISSIONS)[];
}