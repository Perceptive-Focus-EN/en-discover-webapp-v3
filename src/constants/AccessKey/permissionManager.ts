// src/constants/AccessKey/permissionManager.ts

import { AccessLevel } from './access_levels';
import { getPermissionsForAccountTypeAndLevel } from './permissions/index';
import { PERMISSIONS } from './permissions';
import { UserAccountType } from './accounts';

export interface UserWithPermissions {
  accountType: UserAccountType;
  accessLevel: AccessLevel;
  additionalPermissions?: string[];
  permissions: string[]; // or the appropriate type for permissions
}

export function hasPermission(user: UserWithPermissions, requiredPermission: keyof typeof PERMISSIONS): boolean {
  const basePermissions = getPermissionsForAccountTypeAndLevel(user.accountType, user.accessLevel);
  const allPermissions = [...basePermissions, ...(user.additionalPermissions || [])];
  
  return allPermissions.includes(requiredPermission);
}

export function hasAllPermissions(user: UserWithPermissions, requiredPermissions: (keyof typeof PERMISSIONS)[]): boolean {
  return requiredPermissions.every(permission => hasPermission(user, permission));
}

export function hasAnyPermission(user: UserWithPermissions, requiredPermissions: (keyof typeof PERMISSIONS)[]): boolean {
  return requiredPermissions.some(permission => hasPermission(user, permission));
}