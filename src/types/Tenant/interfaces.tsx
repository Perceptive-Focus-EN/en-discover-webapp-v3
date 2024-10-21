// src/types/Tenant/interfaces.ts

import { AllRoles } from "@/constants/AccessKey/AccountRoles/index";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { PersonalPermission } from "@/constants/AccessKey/permissions/personal";
import { AnnualRevenue, EmployeeCount, Goals, Industry } from "../Shared/enums";
import { User } from "../User/interfaces";
import { UserAccountTypeEnum } from "@/constants/AccessKey/accounts";

export interface BaseTenant {
    tenantId: string;
    name: string;
    domain: string;
    email: string;
    industry: Industry;
    type: UserAccountTypeEnum;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TenantDetails {
    employeeCount?: EmployeeCount;
    annualRevenue?: AnnualRevenue;
    goals?: Goals[];
    formationDate?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    website?: string;
    region: string;
}

export interface Tenant extends BaseTenant {
    ownerId: string;
    users: string[]; // Array of userIds
    usersCount: number;
    parentTenantId?: string;
    pendingUserRequests: string[]; // Array of user IDs with pending join requests
    details: TenantDetails;
    resourceUsage: number;
    resourceLimit: number;
    isDeleted: boolean;
}

export interface TenantInfo extends Tenant {}

export interface UserWithTenantInfo extends User {
    tenantInfo: TenantInfo | null;
}

export interface TenantAssociation {
    accountType: UserAccountTypeEnum;
    tenantId: string;
    role: AllRoles;
    accessLevel: AccessLevel;
    permissions: PersonalPermission[];
    tenant: BaseTenant & {
        avatarUrl?: string;
        ownerId?: string;
        users?: string[]; // Array of userIds
        usersCount?: number;
        parentTenantId?: string;
        details?: TenantDetails;
        resourceUsage?: number;
        resourceLimit?: number;
        isDeleted?: boolean;
    };
}