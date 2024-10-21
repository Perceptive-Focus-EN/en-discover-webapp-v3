
import dotenv from 'dotenv';
dotenv.config();


import { OnboardingStepName, OnboardingStage } from '../types/Onboarding/interfaces';

export const ONBOARDING_STEPS: OnboardingStepName[] = [
    'Verification',
    'PersonalInfo',
    'CompanyInfo',
    'RoleSelection',
    'GoalsAndObjectives',
    'FinancialInfo',
    'Completed',
];

export const ONBOARDING_STATUS: Record<number, OnboardingStage> = {
    0: 'initial',
    1: 'in_progress',
    2: 'complete',
} as const;

export const ONBOARDING_STEP_INDEX = {
    Verification: 0,
    PersonalInfo: 1,
    CompanyInfo: 2,
    RoleSelection: 3,
    GoalsAndObjectives: 4,
    FinancialInfo: 5,
    Complete: 6,
};

    export const ONBOARDING_STATUS_VALUES = Object.values(ONBOARDING_STATUS);
    
    export const ONBOARDING_STATUS_KEYS = Object.keys(ONBOARDING_STATUS).map(Number);
    
    export const ONBOARDING_STATUS_VALUES_MAP = Object.fromEntries(
        Object.entries(ONBOARDING_STATUS).map(([key, value]) => [value, Number(key)])
    );
    
    export const ONBOARDING_STATUS_KEYS_MAP = Object.fromEntries(
        Object.entries(ONBOARDING_STATUS).map(([key, value]) => [Number(key), value])
    );
    
    export const ONBOARDING_STATUS_VALUES_WITHOUT_COMPLETE = Object.values(ONBOARDING_STATUS).filter(
        (value) => value !== 'complete'
    );
    
    export const ONBOARDING_STATUS_KEYS_WITHOUT_COMPLETE = Object.keys(ONBOARDING_STATUS).map(Number).filter(
        (key) => key !== 2
    );
    
    export const ONBOARDING_STATUS_VALUES_MAP_WITHOUT_COMPLETE = Object.fromEntries(
        Object.entries(ONBOARDING_STATUS).map(([key, value]) => [value, Number(key)]).filter(
        ([value]) => value !== 2
        )
    );
    
    export const ONBOARDING_STATUS_KEYS_MAP_WITHOUT_COMPLETE = Object.fromEntries(
        Object.entries(ONBOARDING_STATUS).map(([key, value]) => [Number(key), value]).filter(
        ([key]) => key !== 2
        )
    );


export interface OnboardingStatus {
  0: 'incomplete';
  1: 'in_progress';
  2: 'complete';
}

export interface OnboardingStatusMaps {
  ONBOARDING_STATUS: OnboardingStatus;
  ONBOARDING_STATUS_VALUES: string[];
  ONBOARDING_STATUS_KEYS: number[];
  ONBOARDING_STATUS_VALUES_MAP: { [key: string]: number };
  ONBOARDING_STATUS_KEYS_MAP: { [key: number]: string };
  ONBOARDING_STATUS_VALUES_WITHOUT_COMPLETE: string[];
  ONBOARDING_STATUS_KEYS_WITHOUT_COMPLETE: number[];
  ONBOARDING_STATUS_VALUES_MAP_WITHOUT_COMPLETE: { [key: string]: number };
  ONBOARDING_STATUS_KEYS_MAP_WITHOUT_COMPLETE: { [key: number]: string };
}

export type OnboardingStep = typeof ONBOARDING_STEPS[number];

// constants/onboarding.ts


export const ONBOARDING_ENDPOINTS = {
  PERSONAL_INFO: '/api/auth/onboarding/personal-info',
  COMPANY_INFO: '/api/auth/onboarding/company-info',
  ROLE_SELECTION: '/api/auth/onboarding/role-selection', // Note the hyphen
  GOALS_OBJECTIVES: '/api/auth/onboarding/goals-objectives',
  FINANCIAL_INFO: '/api/auth/onboarding/financial-info',
};
