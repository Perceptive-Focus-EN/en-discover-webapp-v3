import { ALTERNATIVE_EDUCATION_PERMISSIONS } from './alternativeEducation';
import { HIGHER_EDUCATION_PERMISSIONS } from './higherEducation';
import { K12_PERMISSIONS } from './k12';
import { PROFESSIONAL_TRAINING_EDUCATION_PERMISSIONS } from './professionalTrainingEducation';
import { RESEARCH_INSTITUTE_PERMISSIONS } from './researchInstitutes';
import { SPECIAL_EDUCATION_PERMISSIONS } from './specialEducation';
import { VOCATIONAL_AND_ADULT_EDUCATION_PERMISSIONS } from './vocationalAndAdultEducation';
import { AccessLevel } from "../../access_levels";
import { InstituteRoles } from '../../AccountRoles/instituteRoles';

export type InstitutePermission = 
  | typeof ALTERNATIVE_EDUCATION_PERMISSIONS[AccessLevel.L0][number]
  | typeof HIGHER_EDUCATION_PERMISSIONS[AccessLevel.L0][number]
  | typeof K12_PERMISSIONS[AccessLevel.L0][number]
  | typeof PROFESSIONAL_TRAINING_EDUCATION_PERMISSIONS[AccessLevel.L0][number]
  | typeof RESEARCH_INSTITUTE_PERMISSIONS[AccessLevel.L0][number]
  | typeof SPECIAL_EDUCATION_PERMISSIONS[AccessLevel.L0][number]
  | typeof VOCATIONAL_AND_ADULT_EDUCATION_PERMISSIONS[AccessLevel.L0][number];

export const INSTITUTE_PERMISSIONS: Record<keyof typeof InstituteRoles, Record<AccessLevel, InstitutePermission[]>> = {
  AlternativeEducation: ALTERNATIVE_EDUCATION_PERMISSIONS,
  HigherEducation: HIGHER_EDUCATION_PERMISSIONS,
  K_12: K12_PERMISSIONS,
  ProfessionalTrainingEducation: PROFESSIONAL_TRAINING_EDUCATION_PERMISSIONS,
  ResearchInstitutes: RESEARCH_INSTITUTE_PERMISSIONS,
  SpecialEducation: SPECIAL_EDUCATION_PERMISSIONS,
  VocationalAndAdultEducation: VOCATIONAL_AND_ADULT_EDUCATION_PERMISSIONS,
};

export {
  ALTERNATIVE_EDUCATION_PERMISSIONS,
  HIGHER_EDUCATION_PERMISSIONS,
  K12_PERMISSIONS,
  PROFESSIONAL_TRAINING_EDUCATION_PERMISSIONS,
  RESEARCH_INSTITUTE_PERMISSIONS,
  SPECIAL_EDUCATION_PERMISSIONS,
  VOCATIONAL_AND_ADULT_EDUCATION_PERMISSIONS,
};