import { AccessLevel } from '../../constants/AccessKey/access_levels';
import {ROLES, AllRoles} from '../../constants/AccessKey/AccountRoles';
import { AnnualRevenue, EmployeeCount, Industry } from '../Shared/enums';
import { ExtendedUserInfo } from "../User/interfaces";
import {UserAccountType} from '../../constants/AccessKey/accounts';
export type OnboardingStage = 'initial' | 'in_progress' | 'complete';

export type OnboardingStepName =
    | 'Verification'
    | 'PersonalInfo'
    | 'CompanyInfo'
    | 'RoleSelection'
    | 'GoalsAndObjectives'
    | 'FinancialInfo'
    | 'Completed';

export interface OnboardingStatusDetails {
  status: string;
  steps: {
    name: OnboardingStepName;
    completed: boolean;
  }[];
  stage: OnboardingStage;
  isOnboardingComplete: boolean;
  lastUpdated: string;
  currentStepIndex: number;
}

export const ONBOARDING_STARTED: OnboardingStatusDetails = {
  steps: [
    { name: 'Verification', completed: false },
    { name: 'PersonalInfo', completed: false },
    { name: 'CompanyInfo', completed: false },
    { name: 'RoleSelection', completed: false },
    { name: 'GoalsAndObjectives', completed: false },
    { name: 'FinancialInfo', completed: false },
    { name: 'Completed', completed: false }
  ],
  stage: 'initial',
  isOnboardingComplete: false,
  lastUpdated: '',
  currentStepIndex: 0,
  status: ''
};

export interface OnboardingStep {
  name: OnboardingStepName;
  completed: boolean;
}

export interface OnboardingStepRequest {
  userId: string;
  stage: OnboardingStage;
  step: OnboardingStepName;
  data: OnboardingStepData;
  tenantId: string;
}

export interface OnboardingStepResponse {
  message: string;
  user: ExtendedUserInfo | null;
}

export type OnboardingStepData =
  | VerificationStepData
  | PersonalInfoStepData
  | CompanyInfoStepData
  | RoleSelectionStepData
  | GoalsAndObjectivesStepData
  | FinancialInfoStepData

export interface VerificationStepData {
  verificationToken: string;
  // Add other verification step fields as needed
}

export interface PersonalInfoStepData {
  firstName: string;
  lastName: string;
  email: string
  dob: string;
  phone: string;
  // Add other personal info fields as needed
}

export interface CompanyInfoStepData {
  companyName: string;
  companySize: EmployeeCount;
  industry: Industry;
  employeeCount: EmployeeCount;
  annualRevenue: AnnualRevenue;
  // Add other company info fields as needed
}

export interface RoleSelectionStepData {
  role: AllRoles;
  accessLevel: AccessLevel;
  accountType: UserAccountType;
  accessKey?: string;
  // Add other role selection fields as needed
}

export interface GoalsAndObjectivesStepData {
  // Define goals and objectives fields
}

export interface FinancialInfoStepData {
  // Define financial info fields
}
