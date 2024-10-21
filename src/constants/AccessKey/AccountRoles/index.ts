// src/constants/AccessKey/AccountRoles/index.ts

import { BusinessIndustryRoles } from './business-roles';
import { FamilyRoles } from './family-roles';
import { FinanceIndustryRoles } from './finance-roles';
import { HealthCareIndustryRoles } from './healthcare-roles';
import { NonProfitRoles } from './non-profit-roles';
import { PersonalRoles } from './personal-roles';
import { TechnologyIndustryRoles } from './technology-roles';
import { InstituteRoles } from './instituteRoles';

// Updated union type of all Roles
export type AllRoles =
  | BusinessIndustryRoles
  | FamilyRoles
  | FinanceIndustryRoles
  | HealthCareIndustryRoles
  | NonProfitRoles
  | PersonalRoles
  | TechnologyIndustryRoles
  | keyof typeof InstituteRoles;

// Updated grouping object
export const ROLES = {
  Business: BusinessIndustryRoles,
  Family: FamilyRoles,
  Finance: FinanceIndustryRoles,
  HealthCare: HealthCareIndustryRoles,
  NonProfit: NonProfitRoles,
  Personal: PersonalRoles,
  Technology: TechnologyIndustryRoles,
  Institute: InstituteRoles
};