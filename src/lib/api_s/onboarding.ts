// src/lib/api_s/onboarding.ts
import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { ONBOARDING_ENDPOINTS } from '../../constants/onboarding';
import { OnboardingStepData, OnboardingStepName, CompanyInfoData, PersonalInfoData, RoleSelectionData, GoalsObjectivesData, FinancialInfoData } from '@/types/Onboarding/types';
import { OnboardingStepRequest, OnboardingStepResponse } from '@/types/Onboarding/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const onboardingApi = {
  updateOnboardingStep: async (data: OnboardingStepRequest): Promise<OnboardingStepResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.UPDATE_ONBOARDING_STEP, data);
    messageHandler.success('Onboarding step updated successfully');
    return response.data;
  },

  updatePersonalInfo: async (data: PersonalInfoData): Promise<OnboardingStepData> => {
    const response = await axiosInstance.post(ONBOARDING_ENDPOINTS.PERSONAL_INFO, data);
    messageHandler.success('Personal information updated');
    return response.data;
  },

  updateCompanyInfo: async (data: CompanyInfoData): Promise<OnboardingStepData> => {
    const response = await axiosInstance.post(ONBOARDING_ENDPOINTS.COMPANY_INFO, data);
    messageHandler.success('Company information updated');
    return response.data;
  },

  updateRoleSelection: async (data: RoleSelectionData): Promise<OnboardingStepData> => {
    const response = await axiosInstance.post(ONBOARDING_ENDPOINTS.ROLE_SELECTION, data);
    messageHandler.success('Role selection updated');
    return response.data;
  },

  updateGoalsAndObjectives: async (data: GoalsObjectivesData): Promise<OnboardingStepData> => {
    const response = await axiosInstance.post(ONBOARDING_ENDPOINTS.GOALS_OBJECTIVES, data);
    messageHandler.success('Goals and objectives updated');
    return response.data;
  },

  updateFinancialInfo: async (data: FinancialInfoData): Promise<OnboardingStepData> => {
    const response = await axiosInstance.post(ONBOARDING_ENDPOINTS.FINANCIAL_INFO, data);
    messageHandler.success('Financial information updated');
    return response.data;
  },

  updateOnboardingStepByName: async (
    stepName: OnboardingStepName, 
    data: OnboardingStepData
  ): Promise<OnboardingStepResponse> => {
    const response = await axiosInstance.post(
      `/api/onboarding-steps/${stepName.toLowerCase().replace('_', '-')}`, 
      data
    );
    messageHandler.success(`${stepName} updated successfully`);
    return response.data;
  }
};