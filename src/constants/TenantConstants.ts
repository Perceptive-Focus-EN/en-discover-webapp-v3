// src/constants/TenantConstants.ts

import { Industry, EmployeeCount, AnnualRevenue, Goals } from "../types/Shared/enums";
import { AllRoles } from "@/constants/AccessKey/AccountRoles/index";
import { AccessLevel } from "@/constants/AccessKey/access_levels";
import { PersonalPermission } from "@/constants/AccessKey/permissions/personal";
import { UserAccountTypeEnum } from "@/constants/AccessKey/accounts";

export const TENANT_FIELDS = {
    ID: '_id',
    TENANT_ID: 'tenantId',
    NAME: 'name',
    DOMAIN: 'domain',
    EMAIL: 'email',
    INDUSTRY: 'industry',
    TYPE: 'type',
    IS_ACTIVE: 'isActive',
    CREATED_AT: 'createdAt',
    UPDATED_AT: 'updatedAt',
} as const;

export const TENANT_TYPES = {
    PERSONAL: 'personal',
    BUSINESS: 'business',
    FAMILY: 'family',
    INSTITUTE: 'institute',
} as const;

export const TENANT_DETAILS_FIELDS = {
    EMPLOYEE_COUNT: 'employeeCount',
    ANNUAL_REVENUE: 'annualRevenue',
    GOALS: 'goals',
    FORMATION_DATE: 'formationDate',
    PHONE: 'phone',
    ADDRESS: 'address',
    CITY: 'city',
    STATE: 'state',
    ZIP: 'zip',
    COUNTRY: 'country',
    WEBSITE: 'website',
    REGION: 'region',
} as const;

export const TENANT_EXTENDED_FIELDS = {
    ...TENANT_FIELDS,
    OWNER_ID: 'ownerId',
    USERS: 'users',
    USERS_COUNT: 'usersCount',
    PARENT_TENANT_ID: 'parentTenantId',
    DETAILS: 'details',
    RESOURCE_USAGE: 'resourceUsage',
    RESOURCE_LIMIT: 'resourceLimit',
    IS_DELETED: 'isDeleted',
} as const;

export const TENANT_INFO_FIELDS = {
    ...TENANT_EXTENDED_FIELDS,
} as const;

export const USER_WITH_TENANT_INFO_FIELDS = {
    TENANT_INFO: 'tenantInfo',
} as const;

export const TENANT_ASSOCIATION_FIELDS = {
    TYPE: 'type',
    TENANT_ID: 'tenantId',
    TITLE: 'title',
    ACCESS_LEVEL: 'accessLevel',
    PERMISSIONS: 'permissions',
    TENANT: 'tenant',
} as const;

export const TENANT_ASSOCIATION_TENANT_FIELDS = {
    ...TENANT_FIELDS,
    AVATAR_URL: 'avatarUrl',
    OWNER_ID: 'ownerId',
    USERS: 'users',
    USERS_COUNT: 'usersCount',
    PARENT_TENANT_ID: 'parentTenantId',
    DETAILS: 'details',
    RESOURCE_USAGE: 'resourceUsage',
    RESOURCE_LIMIT: 'resourceLimit',
    IS_DELETED: 'isDeleted',
} as const;