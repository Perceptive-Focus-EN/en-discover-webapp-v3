// src/constants/AccessKey/permissions/overseer.ts

import { PERMISSIONS } from '../permissions';
import { AccessLevel } from '@/constants/AccessKey/access_levels';

export type OverseerPermission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const L0_PERMISSIONS: OverseerPermission[] = [
  PERMISSIONS.USER_READ,
  PERMISSIONS.PROFILE_VIEW,
];

export const L1_PERMISSIONS: OverseerPermission[] = [
  ...L0_PERMISSIONS,
  PERMISSIONS.FRIEND_LIST_VIEW,
  PERMISSIONS.STORAGE_READ,
];

export const L2_PERMISSIONS: OverseerPermission[] = [
  ...L1_PERMISSIONS,
//   PERMISSIONS.MEDICAL_HISTORY_VIEW,
//   PERMISSIONS.APPOINTMENT_VIEW,
];

export const L3_PERMISSIONS: OverseerPermission[] = [
  ...L2_PERMISSIONS,
//   PERMISSIONS.LAB_RESULT_READ,
//   PERMISSIONS.PRESCRIPTION_READ,
];

export const L4_PERMISSIONS: OverseerPermission[] = [
  ...L3_PERMISSIONS,
//   PERMISSIONS.INSURANCE_CLAIM_READ,
//   PERMISSIONS.AUDIT_LOG_VIEW,
];

export const OVERSEER_PERMISSIONS: Record<AccessLevel, OverseerPermission[]> = {
  [AccessLevel.L0]: L0_PERMISSIONS,
  [AccessLevel.L1]: L1_PERMISSIONS,
  [AccessLevel.L2]: L2_PERMISSIONS,
  [AccessLevel.L3]: L3_PERMISSIONS,
  [AccessLevel.L4]: L4_PERMISSIONS,
};