import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import {ONBOARDING_ENDPOINTS } from '../../constants/onboarding';
import { OnboardingStepData, OnboardingStepName, CompanyInfoData, PersonalInfoData, RoleSelectionData, GoalsObjectivesData, FinancialInfoData } from '@/types/Onboarding/types';
import { OnboardingStepRequest, OnboardingStepResponse } from '@/types/Onboarding/interfaces';

export const onboardingApi = {
  updateOnboardingStep: (data: OnboardingStepRequest): Promise<OnboardingStepResponse> =>
    axiosInstance.post(API_ENDPOINTS.UPDATE_ONBOARDING_STEP, data),

  updatePersonalInfo: (data: PersonalInfoData): Promise<OnboardingStepData> =>
    axiosInstance.post(ONBOARDING_ENDPOINTS.PERSONAL_INFO, data),

  updateCompanyInfo: (data: CompanyInfoData): Promise<OnboardingStepData> =>
    axiosInstance.post(ONBOARDING_ENDPOINTS.COMPANY_INFO, data),

  updateRoleSelection: (data: RoleSelectionData): Promise<OnboardingStepData> =>
    axiosInstance.post(ONBOARDING_ENDPOINTS.ROLE_SELECTION, data),

  updateGoalsAndObjectives: (data: GoalsObjectivesData): Promise<OnboardingStepData> =>
    axiosInstance.post(ONBOARDING_ENDPOINTS.GOALS_OBJECTIVES, data),

  updateFinancialInfo: (data: FinancialInfoData): Promise<OnboardingStepData> =>
    axiosInstance.post(ONBOARDING_ENDPOINTS.FINANCIAL_INFO, data),

  updateOnboardingStepByName: (stepName: OnboardingStepName, data: OnboardingStepData): Promise<OnboardingStepResponse> =>
    axiosInstance.post(`/api/onboarding-steps/${stepName.toLowerCase().replace('_', '-')}`, data),
};