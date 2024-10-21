import { Role, AccessLevel, Permission } from '../constants/constants';
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
  role?: Role;
  accessLevel?: AccessLevel;
  permissions?: Permission;
  onboardingStatus?: OnboardingStatus;
  avatar?: string;
}
