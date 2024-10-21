import { CompanyInfoStepData, FinancialInfoStepData, GoalsAndObjectivesStepData, PersonalInfoStepData, RoleSelectionStepData, VerificationStepData } from "./interfaces";

export type OnboardingStage = 'initial' | 'in_progress' | 'complete';

export type OnboardingStepName =
    | 'Verification'
    | 'PersonalInfo'
    | 'CompanyInfo'
    | 'RoleSelection'
    | 'GoalsAndObjectives'
    | 'FinancialInfo'
    | 'Completed';



export type OnboardingStepData =
    | VerificationStepData
    | PersonalInfoStepData
    | CompanyInfoStepData
    | RoleSelectionStepData
    | GoalsAndObjectivesStepData
    | FinancialInfoStepData


    // Export the specific types
export type CompanyInfoData = CompanyInfoStepData;
export type PersonalInfoData = PersonalInfoStepData;
export type RoleSelectionData = RoleSelectionStepData;
export type GoalsObjectivesData = GoalsAndObjectivesStepData;
export type FinancialInfoData = FinancialInfoStepData;