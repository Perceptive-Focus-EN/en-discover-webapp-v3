import { PERMISSIONS } from '../../permissions';
import { AccessLevel } from "../../access_levels";

export type K12Permission = typeof PERMISSIONS.INSTITUTE[keyof typeof PERMISSIONS.INSTITUTE];

export const L0_PERMISSIONS: K12Permission[] = [
  PERMISSIONS.INSTITUTE.USER_READ,
  PERMISSIONS.INSTITUTE.RESOURCE_READ,
  PERMISSIONS.INSTITUTE.STORAGE_READ,
  PERMISSIONS.INSTITUTE.CURRICULUM_READ,
  PERMISSIONS.INSTITUTE.COURSE_READ,
  PERMISSIONS.INSTITUTE.STUDENT_RECORD_READ,
  PERMISSIONS.INSTITUTE.STUDENT_GRADE_READ,
  PERMISSIONS.INSTITUTE.PARENT_PORTAL_ACCESS,
];

export const L1_PERMISSIONS: K12Permission[] = [
  PERMISSIONS.INSTITUTE.USER_UPDATE,
  PERMISSIONS.INSTITUTE.RESOURCE_UPDATE,
  PERMISSIONS.INSTITUTE.STORAGE_UPDATE,
  PERMISSIONS.INSTITUTE.COURSE_ENROLL,
  PERMISSIONS.INSTITUTE.COURSE_UNENROLL,
  PERMISSIONS.INSTITUTE.STUDENT_GRADE_CREATE,
  PERMISSIONS.INSTITUTE.PARENT_COMMUNICATION_MANAGE,
];

export const L2_PERMISSIONS: K12Permission[] = [
  PERMISSIONS.INSTITUTE.USER_CREATE,
  PERMISSIONS.INSTITUTE.RESOURCE_CREATE,
  PERMISSIONS.INSTITUTE.STORAGE_CREATE,
  PERMISSIONS.INSTITUTE.CURRICULUM_CREATE,
  PERMISSIONS.INSTITUTE.CURRICULUM_UPDATE,
  PERMISSIONS.INSTITUTE.COURSE_CREATE,
  PERMISSIONS.INSTITUTE.COURSE_UPDATE,
  PERMISSIONS.INSTITUTE.STUDENT_RECORD_CREATE,
  PERMISSIONS.INSTITUTE.STUDENT_RECORD_UPDATE,
  PERMISSIONS.INSTITUTE.GRADE_LEVEL_MANAGE,
];

export const L3_PERMISSIONS: K12Permission[] = [
  PERMISSIONS.INSTITUTE.USER_DELETE,
  PERMISSIONS.INSTITUTE.RESOURCE_DELETE,
  PERMISSIONS.INSTITUTE.STORAGE_DELETE,
  PERMISSIONS.INSTITUTE.CURRICULUM_DELETE,
  PERMISSIONS.INSTITUTE.COURSE_DELETE,
  PERMISSIONS.INSTITUTE.STUDENT_RECORD_DELETE,
  PERMISSIONS.INSTITUTE.FACULTY_RECORD_MANAGE,
  PERMISSIONS.INSTITUTE.FACULTY_COURSE_ASSIGN,
  PERMISSIONS.INSTITUTE.PARENT_RECORD_MANAGE,
];

export const L4_PERMISSIONS: K12Permission[] = [
  PERMISSIONS.INSTITUTE.USER_CHANGE_ROLE,
  PERMISSIONS.INSTITUTE.USER_CHANGE_ACCESS_LEVEL,
  PERMISSIONS.INSTITUTE.DATABASE_MANAGE,
  PERMISSIONS.INSTITUTE.ANALYTICS_MANAGE,
  PERMISSIONS.INSTITUTE.SETTINGS_MANAGE,
  PERMISSIONS.INSTITUTE.BILLING_MANAGE,
  PERMISSIONS.INSTITUTE.SUBSCRIPTION_MANAGE,
  PERMISSIONS.INSTITUTE.ACADEMIC_CALENDAR_MANAGE,
  PERMISSIONS.INSTITUTE.PROGRAM_MANAGE,
  PERMISSIONS.INSTITUTE.ADMISSION_APPLICATION_MANAGE,
  PERMISSIONS.INSTITUTE.ENROLLMENT_MANAGE,
  PERMISSIONS.INSTITUTE.FINANCIAL_AID_MANAGE,
  PERMISSIONS.INSTITUTE.SCHOLARSHIP_MANAGE,
  PERMISSIONS.INSTITUTE.ASSESSMENT_MANAGE,
  PERMISSIONS.INSTITUTE.ACCREDITATION_MANAGE,
  PERMISSIONS.INSTITUTE.COMPLIANCE_MANAGE,
  PERMISSIONS.INSTITUTE.LEGAL_DOCUMENT_MANAGE,
  PERMISSIONS.INSTITUTE.CHILD_SAFETY_MANAGE,
  PERMISSIONS.INSTITUTE.SPECIAL_EDUCATION_PROGRAM_MANAGE,
];

export const K12_PERMISSIONS: Record<AccessLevel, K12Permission[]> = {
  [AccessLevel.L0]: L0_PERMISSIONS,
  [AccessLevel.L1]: [...L0_PERMISSIONS, ...L1_PERMISSIONS],
  [AccessLevel.L2]: [...L0_PERMISSIONS, ...L1_PERMISSIONS, ...L2_PERMISSIONS],
  [AccessLevel.L3]: [...L0_PERMISSIONS, ...L1_PERMISSIONS, ...L2_PERMISSIONS, ...L3_PERMISSIONS],
  [AccessLevel.L4]: [...L0_PERMISSIONS, ...L1_PERMISSIONS, ...L2_PERMISSIONS, ...L3_PERMISSIONS, ...L4_PERMISSIONS],
};