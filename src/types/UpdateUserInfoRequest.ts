import { OnboardingStatus } from '../constants/onboarding';

export interface UpdateUserInfoRequest {
  id: string
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dob?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  role?: string;
  accessLevel?: string;
  permissions?: string[];
  onboardingStatus?: OnboardingStatus;
  avatar?: string;
}
