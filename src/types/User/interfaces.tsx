// src/types/User/interfaces.ts

import { OnboardingStage } from "../Onboarding/types";
import { ROLES, AllRoles } from "@/constants/AccessKey/AccountRoles/index";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { PersonalPermission } from "@/constants/AccessKey/permissions/personal";
import { TenantAssociation, TenantInfo } from "../Tenant/interfaces";
import { SocialPermission } from "@/constants/socialMediaPermissions";
import { UserAccountType, UserAccountTypeEnum, Subscription_Type } from "@/constants/AccessKey/accounts";

export interface UpdateUserInfoRequest {
    firstName?: string;
    lastName?: string;
    email?: string;
    title?: AllRoles;
    accountType: UserAccountType;
    accessLevel?: AccessLevel;
    permissions?: PersonalPermission[];
    isActive?: boolean;
    isVerified?: boolean;
    tenants?: string[];
    onboardingStatus?: OnboardingStatusDetails;
    department?: string;
    dob?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    avatarUrl?: string;
    lastLogin?: string;
    isDeleted?: boolean;
}

export interface BaseUser {
    userId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    title: AllRoles;
    accountType: UserAccountType;
    accessLevel: AccessLevel;
    permissions: PersonalPermission[];
    nfcId?: string;
    subscriptionType: Subscription_Type;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    tenantId: string;
    tenants: string[];
    personalTenantId: string;
    currentTenantId: string;
    tenantAssociations: TenantAssociation[];
    onboardingStatus: OnboardingStatusDetails;
    department: string;
    lastLogin: string;
    isDeleted: boolean;
}

export interface UserProfile {
    dob?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    avatar?: string;
    bio?: string;
    interests?: string[];
}

export interface User extends BaseUser {
    profile: UserProfile;
    connections: string[];
    connectionRequests: {
        sent: string[];
        received: string[];
    };
    privacySettings: {
        profileVisibility: 'public' | 'connections' | 'private';
    };
}

export interface ExtendedUserInfo extends User {
    role: AllRoles;
    tenant: TenantInfo | null;
    softDelete: boolean | null;
    reminderSent?: boolean;
    reminderSentAt?: string;
}


export interface SocialConnection {
    tenantId: string;
    userId: string;
    connectedUserId: string;
    status: 'pending' | 'accepted' | 'blocked';
    permissions: SocialPermission[];
}

export interface UserConnection {
    tenantId: string;
    userId: string;
    connectedUserId: string;
    status: 'pending' | 'accepted' | 'blocked';
    permissions: PersonalPermission[];
}

export interface OnboardingStatusDetails {
    isOnboardingComplete: boolean;
    steps: Array<{ name: string; completed: boolean }>;
    lastUpdated: string;
    currentStepIndex: number;
    stage: 'initial' | 'inProgress' | 'complete';
}