// src/constants/AccessKey/Roles/instituteRoles/index.ts

import { AlternativeEducationRoles } from './AlternativeEducation';
import { HigherEducationRoles } from './HigherEducation';
import { K_12_Roles } from './K-12';
import { ProfessionalTrainingEducationRoles } from './ProfessionalTrainingEducation';
import { ResearchInstitutesRoles } from './ResearchInstitutes';
import { SpecialEducationRoles } from './SpecialEducation';
import { VocationalAndAdultEducationRoles } from './VocationalAndAdultEducation';

export {
    AlternativeEducationRoles,
    HigherEducationRoles,
    K_12_Roles,
    ProfessionalTrainingEducationRoles,
    ResearchInstitutesRoles,
    SpecialEducationRoles,
    VocationalAndAdultEducationRoles
};

// You can also create a union type of all institute Roles if needed
export type AllInstituteRoles =
    | AlternativeEducationRoles
    | HigherEducationRoles
    | K_12_Roles
    | ProfessionalTrainingEducationRoles
    | ResearchInstitutesRoles
    | SpecialEducationRoles
    | VocationalAndAdultEducationRoles;

// If you want to group them by institute type, you can create an object like this:
export const InstituteRoles = {
    AlternativeEducation: AlternativeEducationRoles,
    HigherEducation: HigherEducationRoles,
    K_12: K_12_Roles,
    ProfessionalTrainingEducation: ProfessionalTrainingEducationRoles,
    ResearchInstitutes: ResearchInstitutesRoles,
    SpecialEducation: SpecialEducationRoles,
    VocationalAndAdultEducation: VocationalAndAdultEducationRoles
};