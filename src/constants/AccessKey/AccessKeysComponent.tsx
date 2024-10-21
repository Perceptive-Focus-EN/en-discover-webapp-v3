import React from 'react';
import { ACCESS_LEVELS } from './access_levels';
import { SYSTEM_LEVEL_ROLES } from './AccountRoles/system-level-roles';
import { PERMISSIONS } from './permissions';
import { ACCOUNT_TYPES, Subscription_Type } from './accounts';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES, AllRoles} from './AccountRoles/index';

interface AccessKeyParams {
    USERID: string;
    ASSOCIATED_TENANT_ID: string;
    SYSTEM_LEVEL_ROLES: string;
    SUBSCRIPTION_TYPE: string;
    ACCOUNT_TYPES: string;
    TITLE: string;
    ACCESS_LEVELS: string;
    PERMISSIONS: string[];
}

interface AccessKey extends AccessKeyParams {
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

const createAccessKey = (params: AccessKeyParams): AccessKey => {
    return {
        ...params,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
    };
};

const AccessKeysComponent: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>User not authenticated</div>;
    }

    const accessKeys = {
        personal: createAccessKey({
            USERID: user.userId,
            ASSOCIATED_TENANT_ID: user.currentTenantId,
            SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,

            TITLE: ROLES.Personal.SELF,
            SUBSCRIPTION_TYPE: 'TRIAL',
            ACCOUNT_TYPES: ACCOUNT_TYPES.PERSONAL,

            ACCESS_LEVELS: ACCESS_LEVELS.L4,
            PERMISSIONS: [
                ...Object.values(PERMISSIONS.PERSONAL),
                PERMISSIONS.SETTINGS_MANAGE
            ]
        }),

        family: createAccessKey({
            USERID: user.userId,
            ASSOCIATED_TENANT_ID: user.currentTenantId,
            SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,

            TITLE: ROLES.Family.HEAD_OF_HOUSEHOLD,
            SUBSCRIPTION_TYPE: 'TRIAL',
            ACCOUNT_TYPES: ACCOUNT_TYPES.FAMILY,

            ACCESS_LEVELS: ACCESS_LEVELS.L4,
            PERMISSIONS: [
                ...Object.values(PERMISSIONS.FAMILY),
                PERMISSIONS.SETTINGS_MANAGE
            ]
        }),

        business: createAccessKey({
            USERID: user.userId,
            ASSOCIATED_TENANT_ID: user.currentTenantId,
            SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,

            TITLE: ROLES.Business.OWNER,
            SUBSCRIPTION_TYPE: 'TRIAL',
            ACCOUNT_TYPES: ACCOUNT_TYPES.BUSINESS,

            ACCESS_LEVELS: ACCESS_LEVELS.L4,
            PERMISSIONS: [
                ...Object.values(PERMISSIONS.BUSINESS),
                PERMISSIONS.SETTINGS_MANAGE,
                PERMISSIONS.ANALYTICS_VIEW
            ]
        }),

        financial: createAccessKey({
            USERID: user.userId,
            ASSOCIATED_TENANT_ID: user.currentTenantId,
            SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,

            TITLE: ROLES.Finance.CHIEF_EXECUTIVE_OFFICER,
            SUBSCRIPTION_TYPE: 'TRIAL',
            ACCOUNT_TYPES: ACCOUNT_TYPES.FINANCIAL,

            ACCESS_LEVELS: ACCESS_LEVELS.L4,
            PERMISSIONS: [
                ...Object.values(PERMISSIONS.FINANCIAL),
                PERMISSIONS.SETTINGS_MANAGE,
                PERMISSIONS.ANALYTICS_VIEW
            ]
        }),

        healthCare: createAccessKey({
            USERID: user.userId,
            ASSOCIATED_TENANT_ID: user.currentTenantId,
            SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,

            TITLE: ROLES.HealthCare.CHIEF_MEDICAL_OFFICER,
            SUBSCRIPTION_TYPE: 'TRIAL',
            ACCOUNT_TYPES: ACCOUNT_TYPES.HEALTH_CARE,
            ACCESS_LEVELS: ACCESS_LEVELS.L4,
            PERMISSIONS: [
                ...Object.values(PERMISSIONS.HEALTH_CARE),
                PERMISSIONS.SETTINGS_MANAGE,
                PERMISSIONS.ANALYTICS_VIEW
            ]
        }),

        nonProfit: createAccessKey({
            USERID: user.userId,
            ASSOCIATED_TENANT_ID: user.currentTenantId,
            SYSTEM_LEVEL_ROLES: SYSTEM_LEVEL_ROLES.TENANT,

            TITLE: ROLES.NonProfit.EXECUTIVE_DIRECTOR,
            SUBSCRIPTION_TYPE: 'TRIAL',
            ACCOUNT_TYPES: ACCOUNT_TYPES.NON_PROFIT,

            ACCESS_LEVELS: ACCESS_LEVELS.L4,
            PERMISSIONS: [
                ...Object.values(PERMISSIONS.NON_PROFIT),
                PERMISSIONS.SETTINGS_MANAGE,
                PERMISSIONS.ANALYTICS_VIEW
            ]
        })
    };

    console.log(accessKeys);

    return (
        <div>
            <h1>Access Keys</h1>
            <pre>{JSON.stringify(accessKeys, null, 2)}</pre>
        </div>
    );
};

export default AccessKeysComponent;