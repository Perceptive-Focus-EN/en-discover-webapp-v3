// src/lib/api_s/onboarding.ts
import { api } from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { OnboardingStepRequest } from '@/types/Onboarding/interfaces';

interface OnboardingResponse {
  message: string;
}

export const onboardingApi = {
  updateOnboardingStep: async (data: OnboardingStepRequest): Promise<OnboardingResponse> => {
    return api.post<OnboardingResponse>(
      API_ENDPOINTS.UPDATE_ONBOARDING_STEP,
      data
    );
  }
};