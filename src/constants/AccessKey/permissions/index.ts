import { PERSONAL_PERMISSIONS, PersonalPermission } from './personal';
import { FAMILY_PERMISSIONS, FamilyPermission } from './family';
import { BUSINESS_PERMISSIONS, BusinessPermission } from './business';
import { FINANCIAL_PERMISSIONS, FinancialPermission } from './financial';
import { NON_PROFIT_PERMISSIONS, NonProfitPermission } from './non-profit';
import { HEALTH_CARE_PERMISSIONS, HealthCarePermission } from './healthcare';
import { OVERSEER_PERMISSIONS, OverseerPermission } from './overseer';
import { AccessLevel } from "../access_levels";
import { InstituteRoles } from '../AccountRoles/instituteRoles';
import { INSTITUTE_PERMISSIONS, InstitutePermission } from './institute/index';
import {UserAccountType} from "../accounts";

type PermissionType<T extends UserAccountType> =
  T extends 'PERSONAL' ? PersonalPermission :
  T extends 'FAMILY' ? FamilyPermission :
  T extends 'BUSINESS' ? BusinessPermission :
  T extends 'FINANCIAL' ? FinancialPermission :
  T extends 'NON_PROFIT' ? NonProfitPermission :
  T extends 'HEALTH_CARE' ? HealthCarePermission :
  T extends 'OVERSEER' ? OverseerPermission :
  T extends 'INSTITUTE' ? InstitutePermission :
  never;

type AccessLevelPermissionsType = {
  [T in UserAccountType]: T extends 'INSTITUTE'
    ? { [K in keyof typeof InstituteRoles]: Record<AccessLevel, PermissionType<T>[]> }
    : Record<AccessLevel, PermissionType<T>[]>
};

export const AccessLevelPermissions: AccessLevelPermissionsType = {
  PERSONAL: {
    [AccessLevel.L0]: PERSONAL_PERMISSIONS.L0,
    [AccessLevel.L1]: PERSONAL_PERMISSIONS.L1,
    [AccessLevel.L2]: PERSONAL_PERMISSIONS.L2,
    [AccessLevel.L3]: PERSONAL_PERMISSIONS.L3,
    [AccessLevel.L4]: PERSONAL_PERMISSIONS.L4,
  },
  FAMILY: {
    [AccessLevel.L0]: FAMILY_PERMISSIONS.L0,
    [AccessLevel.L1]: FAMILY_PERMISSIONS.L1,
    [AccessLevel.L2]: FAMILY_PERMISSIONS.L2,
    [AccessLevel.L3]: FAMILY_PERMISSIONS.L3,
    [AccessLevel.L4]: FAMILY_PERMISSIONS.L4,
  },
  BUSINESS: {
    [AccessLevel.L0]: BUSINESS_PERMISSIONS.L0,
    [AccessLevel.L1]: BUSINESS_PERMISSIONS.L1,
    [AccessLevel.L2]: BUSINESS_PERMISSIONS.L2,
    [AccessLevel.L3]: BUSINESS_PERMISSIONS.L3,
    [AccessLevel.L4]: BUSINESS_PERMISSIONS.L4,
  },
  FINANCIAL: {
    [AccessLevel.L0]: FINANCIAL_PERMISSIONS.L0,
    [AccessLevel.L1]: FINANCIAL_PERMISSIONS.L1,
    [AccessLevel.L2]: FINANCIAL_PERMISSIONS.L2,
    [AccessLevel.L3]: FINANCIAL_PERMISSIONS.L3,
    [AccessLevel.L4]: FINANCIAL_PERMISSIONS.L4,
  },
  NON_PROFIT: {
    [AccessLevel.L0]: NON_PROFIT_PERMISSIONS.L0,
    [AccessLevel.L1]: NON_PROFIT_PERMISSIONS.L1,
    [AccessLevel.L2]: NON_PROFIT_PERMISSIONS.L2,
    [AccessLevel.L3]: NON_PROFIT_PERMISSIONS.L3,
    [AccessLevel.L4]: NON_PROFIT_PERMISSIONS.L4,
  },
  HEALTH_CARE: {
    [AccessLevel.L0]: HEALTH_CARE_PERMISSIONS.L0,
    [AccessLevel.L1]: HEALTH_CARE_PERMISSIONS.L1,
    [AccessLevel.L2]: HEALTH_CARE_PERMISSIONS.L2,
    [AccessLevel.L3]: HEALTH_CARE_PERMISSIONS.L3,
    [AccessLevel.L4]: HEALTH_CARE_PERMISSIONS.L4,
  },
  OVERSEER: {
    [AccessLevel.L0]: OVERSEER_PERMISSIONS[AccessLevel.L0],
    [AccessLevel.L1]: OVERSEER_PERMISSIONS[AccessLevel.L1],
    [AccessLevel.L2]: OVERSEER_PERMISSIONS[AccessLevel.L2],
    [AccessLevel.L3]: OVERSEER_PERMISSIONS[AccessLevel.L3],
    [AccessLevel.L4]: OVERSEER_PERMISSIONS[AccessLevel.L4],
  },
  INSTITUTE: {
    AlternativeEducation: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.AlternativeEducation[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.AlternativeEducation[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.AlternativeEducation[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.AlternativeEducation[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.AlternativeEducation[AccessLevel.L4],
    },
    HigherEducation: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.HigherEducation[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.HigherEducation[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.HigherEducation[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.HigherEducation[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.HigherEducation[AccessLevel.L4],
    },
    K_12: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.K_12[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.K_12[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.K_12[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.K_12[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.K_12[AccessLevel.L4],
    },
    ProfessionalTrainingEducation: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.ProfessionalTrainingEducation[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.ProfessionalTrainingEducation[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.ProfessionalTrainingEducation[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.ProfessionalTrainingEducation[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.ProfessionalTrainingEducation[AccessLevel.L4],
    },
    ResearchInstitutes: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.ResearchInstitutes[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.ResearchInstitutes[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.ResearchInstitutes[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.ResearchInstitutes[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.ResearchInstitutes[AccessLevel.L4],
    },
    SpecialEducation: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.SpecialEducation[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.SpecialEducation[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.SpecialEducation[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.SpecialEducation[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.SpecialEducation[AccessLevel.L4],
    },
    VocationalAndAdultEducation: {
      [AccessLevel.L0]: INSTITUTE_PERMISSIONS.VocationalAndAdultEducation[AccessLevel.L0],
      [AccessLevel.L1]: INSTITUTE_PERMISSIONS.VocationalAndAdultEducation[AccessLevel.L1],
      [AccessLevel.L2]: INSTITUTE_PERMISSIONS.VocationalAndAdultEducation[AccessLevel.L2],
      [AccessLevel.L3]: INSTITUTE_PERMISSIONS.VocationalAndAdultEducation[AccessLevel.L3],
      [AccessLevel.L4]: INSTITUTE_PERMISSIONS.VocationalAndAdultEducation[AccessLevel.L4],
    },
  },
  MEMBER: {
    [AccessLevel.L0]: [],
    [AccessLevel.L1]: [],
    [AccessLevel.L2]: [],
    [AccessLevel.L3]: [],
    [AccessLevel.L4]: [],
  },
  OTHER: {
    [AccessLevel.L0]: [],
    [AccessLevel.L1]: [],
    [AccessLevel.L2]: [],
    [AccessLevel.L3]: [],
    [AccessLevel.L4]: [],
  },
  FRIEND: {
    [AccessLevel.L0]: [],
    [AccessLevel.L1]: [],
    [AccessLevel.L2]: [],
    [AccessLevel.L3]: [],
    [AccessLevel.L4]: [],
  },
  PATIENT: {
    [AccessLevel.L0]: [],
    [AccessLevel.L1]: [],
    [AccessLevel.L2]: [],
    [AccessLevel.L3]: [],
    [AccessLevel.L4]: [],
  }
};

export function getPermissionsForAccountTypeAndLevel(accountType: UserAccountType, accessLevel: AccessLevel, instituteType?: keyof typeof InstituteRoles) {
  if (accountType === 'INSTITUTE' && instituteType) {
    return AccessLevelPermissions[accountType][instituteType][accessLevel];
  }
  return (AccessLevelPermissions[accountType] as Record<AccessLevel, PermissionType<typeof accountType>[]>)[accessLevel];
}