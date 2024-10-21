// src/constants/AccessKey/UnifiedAccessKey.ts

import { SYSTEM_LEVEL_ROLES } from '../../constants/AccessKey/AccountRoles/system-level-roles';
import { ACCESS_LEVELS, AccessLevel } from '../../constants/AccessKey/access_levels';
import { PERMISSIONS } from '../../constants/AccessKey/permissions';
import { Subscription_Type, ACCOUNT_TYPES } from '../../constants/AccessKey/accounts';
import { ROLES, AllRoles } from '../../constants/AccessKey/AccountRoles/index';
import { InstituteTypes, BaseInstituteTypes, getRolesForInstituteType, getBaseTypeForInstituteType, InstituteRoles } from '../../constants/AccessKey/AccountRoles/institutes-roles';
import { UnifiedAccessKeyParams } from '../AccessKeyForms/types/UnifiedAccessKey';
import { AccessLevelPermissions } from '../../constants/AccessKey/permissions/index';

export interface UnifiedAccessKey extends UnifiedAccessKeyParams {
  NFC_ID: string; // Add this line
  ACCESS_KEY: string; // Add this line
  BASE_TYPE?: BaseInstituteTypes;
  AVAILABLE_Roles?: Record<string, string>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export function createUnifiedAccessKey(params: UnifiedAccessKeyParams): UnifiedAccessKey {
  let baseType: BaseInstituteTypes | undefined;
  let availableRoles: Record<string, string> | undefined;

  if (params.ACCOUNT_TYPE === ACCOUNT_TYPES.INSTITUTE) {
    baseType = getBaseTypeForInstituteType(params.TITLE as unknown as InstituteTypes);
    availableRoles = getRolesForInstituteType(params.TITLE as unknown as InstituteTypes);
  }

  // Generate a unique access key
  const accessKey = generateUniqueAccessKey(params);


  const nfcId = generateNfcId(); // New function to generate NFC ID

  return {
    ...params,
    NFC_ID: nfcId, // Add this line
    BASE_TYPE: baseType,
    AVAILABLE_Roles: availableRoles,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ACCESS_KEY: accessKey // Add this line
  };
}

function generateNfcId(): string {
  // Generate a unique NFC ID (e.g., UUID v4)
  return 'NFC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Add this function to generate a unique access key
function generateUniqueAccessKey(params: UnifiedAccessKeyParams): string {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substr(2, 5);
  return `${params.ACCOUNT_TYPE}-${params.ACCESS_LEVEL}-${timestamp}-${randomString}`.toUpperCase();
}

export function getDefaultAccessKeyParams(accountType: keyof typeof ACCOUNT_TYPES): Partial<UnifiedAccessKeyParams> {
  const defaultParams: Partial<UnifiedAccessKeyParams> = {
    SYSTEM_LEVEL_ROLE: SYSTEM_LEVEL_ROLES.TENANT,
    SUBSCRIPTION_TYPE: 'TRIAL' as Subscription_Type,
    ACCESS_LEVEL: ACCESS_LEVELS.L4 as AccessLevel,
    USER_ID: '',
    ASSOCIATED_TENANT_ID: '',
  };

  switch (accountType) {
    case ACCOUNT_TYPES.PERSONAL:
      return {
        ...defaultParams,
        ACCOUNT_TYPE: ACCOUNT_TYPES.PERSONAL,
        TITLE: ROLES.Personal.SELF,
        PERMISSIONS: [...Object.values(PERMISSIONS.PERSONAL), PERMISSIONS.SETTINGS_MANAGE]
      };
    case ACCOUNT_TYPES.FAMILY:
      return {
        ...defaultParams,
        ACCOUNT_TYPE: ACCOUNT_TYPES.FAMILY,
        TITLE: ROLES.Family.HEAD_OF_HOUSEHOLD,
        PERMISSIONS: [...Object.values(PERMISSIONS.FAMILY), PERMISSIONS.SETTINGS_MANAGE]
      };
    case ACCOUNT_TYPES.BUSINESS:
      return {
        ...defaultParams,
        ACCOUNT_TYPE: ACCOUNT_TYPES.BUSINESS,
        TITLE: ROLES.Business.OWNER,
        PERMISSIONS: [...Object.values(PERMISSIONS.BUSINESS), PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ANALYTICS_VIEW]
      };
    case ACCOUNT_TYPES.FINANCIAL:
      return {
        ...defaultParams,
        ACCOUNT_TYPE: ACCOUNT_TYPES.FINANCIAL,
        TITLE: ROLES.Finance.CHIEF_EXECUTIVE_OFFICER,
        PERMISSIONS: [...Object.values(PERMISSIONS.FINANCIAL), PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ANALYTICS_VIEW]
      };
    case ACCOUNT_TYPES.HEALTH_CARE:
      return {
        ...defaultParams,
        ACCOUNT_TYPE: ACCOUNT_TYPES.HEALTH_CARE,
        TITLE: ROLES.HealthCare.CHIEF_MEDICAL_OFFICER,
        PERMISSIONS: [...Object.values(PERMISSIONS.HEALTH_CARE), PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ANALYTICS_VIEW]
      };
    case ACCOUNT_TYPES.NON_PROFIT:
      return {
        ...defaultParams,
        ACCOUNT_TYPE: ACCOUNT_TYPES.NON_PROFIT,
        TITLE: ROLES.NonProfit.EXECUTIVE_DIRECTOR,
        PERMISSIONS: [...Object.values(PERMISSIONS.NON_PROFIT), PERMISSIONS.SETTINGS_MANAGE, PERMISSIONS.ANALYTICS_VIEW]
      };
        case ACCOUNT_TYPES.INSTITUTE:
      const instituteDefaults = Object.entries(InstituteRoles).reduce((acc, [instituteType, roles]) => {
        const defaultRole = Object.values(roles)[0]; // Get the first role as default
        acc = {
          ...defaultParams,
          ACCOUNT_TYPE: ACCOUNT_TYPES.INSTITUTE,
          TITLE: defaultRole,
          PERMISSIONS: AccessLevelPermissions.INSTITUTE[instituteType as keyof typeof InstituteRoles][AccessLevel.L4],
          INSTITUTE_TYPE: instituteType as InstituteTypes,
        };
        return acc;
      }, {} as Partial<UnifiedAccessKeyParams>);

      return instituteDefaults;

    default:
      return defaultParams;
  }
}