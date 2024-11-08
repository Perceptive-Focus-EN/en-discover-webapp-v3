// import { HealthCareIndustryRoles } from "../AccessKey/AccountRoles/healthcare-roles";
// import { HealthcareSectorsEnums } from "../healthcare/sectors";
// import { HealthCareSubSectorsEnums } from "./types/permissions";
// import { ClinicalSpecialtiesEnums } from "../path/to/ClinicalSpecialtiesEnums"; // Update the path as necessary
// import { PermissionLevelNames } from "./names";
// import { AccessLevelIds } from "./access";

// export type HealthcareBadgeStructure = {
//   // Identity
//   name: string;
//   email: string;
//   avatarUrl?: string;
  
//   // Healthcare Context
//   sector: HealthcareSectorsEnums;
//   subSector: keyof typeof HealthCareSubSectorsEnums;
//   role: keyof typeof HealthCareIndustryRoles;
//   specialty?: keyof typeof ClinicalSpecialtiesEnums;
  
//   // Access Information
//   permissionLevel: PermissionLevelNames;
//   accessLevelId: AccessLevelIds;
  
//   // Security
//   accessKey: string;
//   nfcId: string;
//   userId: string;
//   tenantId: string;
// };




// // Peremissions


// import { AccessLevel } from "@/constants/AccessKey/access_levels";
// import { HealthCareIndustryRoles } from "@/constants/AccessKey/AccountRoles/healthcare-roles";
// import { HEALTH_CARE_PERMISSIONS, HealthCarePermission } from "@/constants/AccessKey/permissions/healthcare";

// // src/utils/healthcare/permissions.ts
// export const getPermissionsForLevel = (
//   accessLevel: AccessLevel,
//   role: keyof typeof HealthCareIndustryRoles
// ): HealthCarePermission[] => {
//   // Get base permissions for the access level
//   const basePermissions = HEALTH_CARE_PERMISSIONS[accessLevel];

//   // Get role-specific permissions
//   const roleSpecificPermissions = getRoleSpecificPermissions(role);

//   // Combine and filter permissions based on role restrictions
//   return basePermissions.filter(permission => 
//     roleSpecificPermissions.includes(permission)
//   );
// };

// // Helper function to get role-specific permissions
// const getRoleSpecificPermissions = (
//   role: keyof typeof HealthCareIndustryRoles
// ): HealthCarePermission[] => {
//   switch (role) {
//     case 'PHYSICIAN':
//     case 'SURGEON':
//       return [
//         'PATIENT_RECORD_READ',
//         'PATIENT_RECORD_CREATE',
//         'PATIENT_RECORD_UPDATE',
//         'PRESCRIPTION_CREATE',
//         'PRESCRIPTION_UPDATE',
//         'LAB_RESULT_READ',
//         'LAB_RESULT_CREATE',
//         'MEDICAL_HISTORY_VIEW',
//         'MEDICAL_HISTORY_UPDATE',
//       ];

//     case 'NURSE_PRACTITIONER':
//     case 'REGISTERED_NURSE':
//       return [
//         'PATIENT_RECORD_READ',
//         'PATIENT_RECORD_UPDATE',
//         'MEDICAL_HISTORY_VIEW',
//         'LAB_RESULT_READ',
//         'PRESCRIPTION_READ',
//       ];

//     case 'HEALTHCARE_MANAGER':
//     case 'MEDICAL_RECORDS_MANAGER':
//       return [
//         'USER_READ',
//         'USER_CREATE',
//         'USER_UPDATE',
//         'RESOURCE_READ',
//         'RESOURCE_CREATE',
//         'ANALYTICS_READ',
//         'BILLING_VIEW',
//       ];

//     // Add more role-specific permissions as needed
//     default:
//       return ['USER_READ', 'RESOURCE_READ'];
//   }
// };


// roles: '

// // src/utils/healthcare/roles.ts


// import { 
//   HEALTH_CARE_PERMISSIONS, 
//   HealthCarePermission 
// } from '../../../constants/AccessKey/permissions/healthcare';
// import { ClinicalSpecialtiesEnums } from '@/constants/AccessKey/ClinicalSpecialties';
// import { HealthCareIndustryRoles } from '@/constants/AccessKey/AccountRoles/healthcare-roles';

// // Get roles based on healthcare sector
// export const getHealthcareRoles = (sector: keyof typeof HEALTHCARE_SECTORS): string[] => {
//   switch (sector) {
//     case 'CLINICAL':
//       return [
//         HealthCareIndustryRoles.CHIEF_MEDICAL_OFFICER,
//         HealthCareIndustryRoles.PHYSICIAN,
//         HealthCareIndustryRoles.SURGEON,
//         HealthCareIndustryRoles.NURSE_PRACTITIONER,
//         HealthCareIndustryRoles.REGISTERED_NURSE,
//         HealthCareIndustryRoles.ANESTHESIOLOGIST,
//       ];
    
//     case 'EDUCATION':
//       return [
//         HealthCareIndustryRoles.CLINICAL_RESEARCH_COORDINATOR,
//         HealthCareIndustryRoles.HEALTH_EDUCATOR,
//         HealthCareIndustryRoles.BIOMEDICAL_RESEARCHER,
//       ];
    
//     case 'FINANCE':
//       return [
//         HealthCareIndustryRoles.HEALTHCARE_MANAGER,
//         HealthCareIndustryRoles.MEDICAL_RECORDS_MANAGER,
//         HealthCareIndustryRoles.HEALTHCARE_CONSULTANT,
//       ];
    
//     case 'MANUFACTURING':
//       return [
//         HealthCareIndustryRoles.MEDICAL_LABORATORY_TECHNICIAN,
//         HealthCareIndustryRoles.PHARMACY_TECHNICIAN,
//         HealthCareIndustryRoles.RADIOLOGIC_TECHNOLOGIST,
//       ];
    
//     case 'TECHNOLOGY':
//       return [
//         HealthCareIndustryRoles.MEDICAL_LABORATORY_TECHNICIAN,
//         HealthCareIndustryRoles.RADIOLOGIC_TECHNOLOGIST,
//         HealthCareIndustryRoles.HEALTHCARE_CONSULTANT,
//       ];
    
//     case 'GOVERNMENT':
//       return [
//         HealthCareIndustryRoles.PUBLIC_HEALTH_SPECIALIST,
//         HealthCareIndustryRoles.EPIDEMIOLOGIST,
//         HealthCareIndustryRoles.HEALTHCARE_MANAGER,
//       ];
    
//     case 'OTHER':
//       return [
//         HealthCareIndustryRoles.MEDICAL_ASSISTANT,
//         HealthCareIndustryRoles.CASE_MANAGER,
//         HealthCareIndustryRoles.HEALTHCARE_CONSULTANT,
//       ];
    
//     default:
//       return [];
//   }
// };

// // Get specialties based on role
// export const getSpecialtiesForRole = (role: keyof typeof HealthCareIndustryRoles): string[] => {
//   // Only certain roles have specialties
//   const rolesWithSpecialties = {
//     PHYSICIAN: true,
//     SURGEON: true,
//     NURSE_PRACTITIONER: true,
//     ANESTHESIOLOGIST: true,
//   };

//   if (role in rolesWithSpecialties) {
//     return Object.values(ClinicalSpecialtiesEnums);
//   }

//   return [];
// }; '


// //badge

// import { HealthCareIndustryRoles } from "../AccessKey/AccountRoles/healthcare-roles";
// import { HealthcareSectorsEnums } from "../healthcare/sectors";
// import { HealthCareSubSectorsEnums } from "./types/permissions";
// import { ClinicalSpecialtiesEnums } from "../path/to/ClinicalSpecialtiesEnums"; // Update the path as necessary
// import { PermissionLevelNames } from "./names";
// import { AccessLevelIds } from "./access";

// export type HealthcareBadgeStructure = {
//   // Identity
//   name: string;
//   email: string;
//   avatarUrl?: string;
  
//   // Healthcare Context
//   sector: HealthcareSectorsEnums;
//   subSector: keyof typeof HealthCareSubSectorsEnums;
//   role: keyof typeof HealthCareIndustryRoles;
//   specialty?: keyof typeof ClinicalSpecialtiesEnums;
  
//   // Access Information
//   permissionLevel: PermissionLevelNames;
//   accessLevelId: AccessLevelIds;
  
//   // Security
//   accessKey: string;
//   nfcId: string;
//   userId: string;
//   tenantId: string;
// };


// // structuredClone

// import { HealthCareIndustryRoles } from "../AccessKey/AccountRoles/healthcare-roles";
// import { BaseSectorEnums, HealthcareSectorsEnums } from "../healthcare/sectors";
// import {ClinicalSpecialtiesEnums} from "../healthcare/clinical";
// import { HealthCareSubSectorsEnums } from "./types/permissions";
// import { PermissionLevelNames } from "./names";
// import { AccessLevelIds } from "./access";
// import { BasePermission } from "./base";
// import { HealthCareSubjectsEnums } from "./subjects";

// // src/types/permissions/structures.ts
// export type HealthcarePermissionStructure = {
//   // Base Structure (Always Healthcare)
//   baseSector: BaseSectorEnums.HEALTHCARE;
  
//   // Healthcare Specific
//   healthcareSector: HealthcareSectorsEnums;
//   subSector: keyof typeof HealthCareSubSectorsEnums;
  
//   // Role & Access
//   role: keyof typeof HealthCareIndustryRoles;
//   specialty?: keyof typeof ClinicalSpecialtiesEnums;
  
//   // Permissions
//   permissionLevel: PermissionLevelNames;
//   accessLevelId: AccessLevelIds;
//   basePermissions: BasePermission[];
  
//   // Subjects & Actions
//   subjects: HealthCareSubjectsEnums[]; 
//   actions: HealthcareSectorsEnums[];
  
//   // Metadata
//   userId: string;
//   tenantId: string;
//   email: string;
// };