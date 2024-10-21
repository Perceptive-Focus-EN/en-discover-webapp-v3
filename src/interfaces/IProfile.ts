// // src/types/Profile.ts
// // src/types/ProfileInterfaces.ts

// import { UserInfo } from '../types/User/interfaces';
// import { UpdateUserInfoRequest } from '../types/UpdateUserInfoRequest';
// import { Industry } from '../types/Shared/enums';
// import { Role, Permissions, AccessLevel } from '../types/Shared/types';
// import { OnboardingStatus } from '../constants/onboarding';
// import { TenantInfo } from '../types/Tenant/interfaces';
// import { OnboardingRequest } from '../types/request/onboarding';

// export interface ProfileContextType {
//   profile: UserInfo | null;
//   isLoading: boolean;
//   error: string | null;
//   completeOnboarding: (onboardingData: OnboardingRequest) => Promise<void>;
//   updateUserInfo: (updatedInfo: UpdateUserInfoRequest) => Promise<void>;
//   refreshProfile: () => Promise<void>;
//   uploadAvatar: (file: File) => Promise<string>;
//   getCurrentAvatarUrl: () => Promise<string>;
//   updateRole: (role: Role) => void;
//   updatePermissions: (permissions: Permissions) => void;
//   updateAccessLevel: (accessLevel: AccessLevel) => void;
//   updateTenantInfo: (tenantInfo: TenantInfo) => void;
//   updateOnboarding: (status: Partial<OnboardingStatus>) => void;
//   getIndustryRoles: (industry: Industry) => Role[];
//   clearError: () => void;
// }

// export interface ProfileProviderProps {
//   children: React.ReactNode;
// }

// export interface AvatarResponse {
//   avatarUrl: string;
// }
