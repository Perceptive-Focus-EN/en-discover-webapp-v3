import { InstituteTypes, BaseInstituteTypes, getRolesForInstituteType, getBaseTypeForInstituteType } from '../AccountRoles/institutes-roles';
import { SYSTEM_LEVEL_ROLES } from '../AccountRoles/system-level-roles';
import { ACCESS_LEVELS } from '../../../constants/AccessKey/access_levels';
import { PERMISSIONS } from '../../../constants/AccessKey/permissions';
import { Subscription_Type } from '../../../constants/AccessKey/accounts';
import * as authManager from '../../../utils/TokenManagement/authManager';

interface InstituteAccessKeyParams {
  USERID: string;
  ASSOCIATED_TENANT_ID: string;
  SYSTEM_LEVEL_ROLES: string;
  SUBSCRIPTION_TYPE: Subscription_Type;
  INSTITUTE_TYPE: InstituteTypes;
  TITLE: string;
  ACCESS_LEVEL: typeof ACCESS_LEVELS[keyof typeof ACCESS_LEVELS];
  PERMISSIONS: string[];
}

interface InstituteAccessKey extends InstituteAccessKeyParams {
  SYSTEM_LEVEL_ROLE: typeof SYSTEM_LEVEL_ROLES[keyof typeof SYSTEM_LEVEL_ROLES];
  BASE_INSTITUTE_TYPE: BaseInstituteTypes;
  AVAILABLE_Roles: Record<string, string>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function createInstituteAccessKey(params: InstituteAccessKeyParams): InstituteAccessKey {
  const baseType = getBaseTypeForInstituteType(params.INSTITUTE_TYPE);
  const availableRoles = getRolesForInstituteType(params.INSTITUTE_TYPE);

  return {
    ...params,
    SYSTEM_LEVEL_ROLE: SYSTEM_LEVEL_ROLES.TENANT,
    BASE_INSTITUTE_TYPE: baseType,
    AVAILABLE_Roles: availableRoles,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null
  };
}

// Get user from storage
const getUserFromStorage = (): { userId: string; currentTenantId: string } | null => {
  const storedUser = authManager.getStoredUser();
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return {
      userId: user._id || user.id,
      currentTenantId: user.currentTenantId
    };
  }
  return null;
};

// Example usage
const user = getUserFromStorage();

if (user) {
  const instituteAccessKey = createInstituteAccessKey({
    USERID: user.userId,
    ASSOCIATED_TENANT_ID: user.currentTenantId,
    SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,
    INSTITUTE_TYPE: InstituteTypes.UNIVERSITY,
    TITLE: 'DEAN', // Assuming 'DEAN' is one of the available Roles for UNIVERSITY
    SUBSCRIPTION_TYPE: 'TRIAL', // Corrected to use string literal type
    ACCESS_LEVEL: ACCESS_LEVELS.L4,
    PERMISSIONS: [
      ...Object.values(PERMISSIONS.INSTITUTE),
      PERMISSIONS.SETTINGS_MANAGE,
      PERMISSIONS.ANALYTICS_VIEW
    ]
  });

  console.log(instituteAccessKey);
} else {
  console.error('User not found in storage');
}