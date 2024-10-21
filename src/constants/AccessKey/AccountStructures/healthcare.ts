// src/constants/AccessKey/AccountStructures/healthcare.ts

import { AccessLevelPermissions } from '../permissions/index';
import { AccessLevel } from '../access_levels';
import { HealthCarePermission } from '../permissions/healthcare';
import { HealthCareIndustryRoles } from '../AccountRoles/healthcare-roles';
import { SYSTEM_LEVEL_ROLES } from '../AccountRoles/system-level-roles';
import { Subscription_Type } from '../accounts';

export interface HealthcareAccessKey {
    USERID: string;
    ASSOCIATED_TENANT_ID: string;
    SYSTEM_LEVEL_ROLES: typeof SYSTEM_LEVEL_ROLES[keyof typeof SYSTEM_LEVEL_ROLES];
    SUBSCRIPTION_TYPE: Subscription_Type;
    ACCOUNT_TYPE: 'HEALTH_CARE';
    TITLE: HealthCareIndustryRoles;
    ACCESS_LEVEL: AccessLevel;
    PERMISSIONS: HealthCarePermission[];
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

export const HealthcareTitleAccessLevels: Record<HealthCareIndustryRoles, AccessLevel> = {
    [HealthCareIndustryRoles.CHIEF_EXECUTIVE_OFFICER]: AccessLevel.L4,
    [HealthCareIndustryRoles.CHIEF_MEDICAL_OFFICER]: AccessLevel.L4,
    [HealthCareIndustryRoles.CHIEF_NURSING_OFFICER]: AccessLevel.L4,
    [HealthCareIndustryRoles.CHIEF_OPERATING_OFFICER]: AccessLevel.L4,
    [HealthCareIndustryRoles.HOSPITAL_ADMINISTRATOR]: AccessLevel.L4,
    [HealthCareIndustryRoles.PHYSICIAN]: AccessLevel.L3,
    [HealthCareIndustryRoles.SURGEON]: AccessLevel.L3,
    [HealthCareIndustryRoles.NURSE_PRACTITIONER]: AccessLevel.L2,
    [HealthCareIndustryRoles.REGISTERED_NURSE]: AccessLevel.L2,
    [HealthCareIndustryRoles.PHYSICIAN_ASSISTANT]: AccessLevel.L2,
    [HealthCareIndustryRoles.ANESTHESIOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.RADIOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.PHARMACIST]: AccessLevel.L2,
    [HealthCareIndustryRoles.CARDIOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.NEUROLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.ONCOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.PEDIATRICIAN]: AccessLevel.L3,
    [HealthCareIndustryRoles.PSYCHIATRIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.DERMATOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.PHYSICAL_THERAPIST]: AccessLevel.L2,
    [HealthCareIndustryRoles.OCCUPATIONAL_THERAPIST]: AccessLevel.L2,
    [HealthCareIndustryRoles.SPEECH_LANGUAGE_PATHOLOGIST]: AccessLevel.L2,
    [HealthCareIndustryRoles.DIETITIAN]: AccessLevel.L2,
    [HealthCareIndustryRoles.RESPIRATORY_THERAPIST]: AccessLevel.L2,
    [HealthCareIndustryRoles.RADIOLOGIC_TECHNOLOGIST]: AccessLevel.L1,
    [HealthCareIndustryRoles.MEDICAL_LABORATORY_TECHNICIAN]: AccessLevel.L1,
    [HealthCareIndustryRoles.PHARMACY_TECHNICIAN]: AccessLevel.L1,
    [HealthCareIndustryRoles.PSYCHOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.CLINICAL_SOCIAL_WORKER]: AccessLevel.L2,
    [HealthCareIndustryRoles.COUNSELOR]: AccessLevel.L2,
    [HealthCareIndustryRoles.EPIDEMIOLOGIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.PUBLIC_HEALTH_SPECIALIST]: AccessLevel.L3,
    [HealthCareIndustryRoles.HEALTH_EDUCATOR]: AccessLevel.L2,
    [HealthCareIndustryRoles.MEDICAL_RECORDS_MANAGER]: AccessLevel.L2,
    [HealthCareIndustryRoles.HEALTHCARE_MANAGER]: AccessLevel.L3,
    [HealthCareIndustryRoles.PATIENT_SERVICES_COORDINATOR]: AccessLevel.L1,
    [HealthCareIndustryRoles.CLINICAL_RESEARCH_COORDINATOR]: AccessLevel.L2,
    [HealthCareIndustryRoles.BIOMEDICAL_RESEARCHER]: AccessLevel.L3,
    [HealthCareIndustryRoles.PARAMEDIC]: AccessLevel.L2,
    [HealthCareIndustryRoles.EMERGENCY_MEDICAL_TECHNICIAN]: AccessLevel.L1,
    [HealthCareIndustryRoles.MEDICAL_ASSISTANT]: AccessLevel.L1,
    [HealthCareIndustryRoles.CASE_MANAGER]: AccessLevel.L2,
    [HealthCareIndustryRoles.HEALTHCARE_CONSULTANT]: AccessLevel.L3,
};

export function createHealthcareAccessKey(
    userId: string,
    tenantId: string,
    title: HealthCareIndustryRoles,
    subscriptionType: Subscription_Type
): HealthcareAccessKey {
    const accessLevel = HealthcareTitleAccessLevels[title];
    return {
        USERID: userId,
        ASSOCIATED_TENANT_ID: tenantId,
        SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,
        SUBSCRIPTION_TYPE: subscriptionType,
        ACCOUNT_TYPE: 'HEALTH_CARE',
        TITLE: title,
        ACCESS_LEVEL: accessLevel,
        PERMISSIONS: [], // Assign an empty array or appropriate value
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
    };
}

// Function to get permissions for a given title
export function getPermissionsForTitle(title: HealthCareIndustryRoles): HealthCarePermission[] {
    const accessLevel = HealthcareTitleAccessLevels[title];
    // Return an empty array or appropriate permissions based on access level
    return []; // Replace with actual logic to fetch permissions
}

// Function to check if a title has a specific permission
export function titleHasPermission(title: HealthCareIndustryRoles, permission: HealthCarePermission): boolean {
    const permissions = getPermissionsForTitle(title);
    return permissions.includes(permission);
}