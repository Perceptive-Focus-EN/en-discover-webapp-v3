import React from 'react';
import { Check, Business, Group, School, Person } from '@mui/icons-material';
import { Tenant } from '@/types/Tenant/interfaces';
import { UserAccountTypeEnum } from '@/constants/AccessKey/accounts';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { TenantAssociation } from '@/types/User/interfaces';
import { useTheme, Box, Typography, Divider } from '@mui/material';

interface TenantSwitcherProps {
    onAccountChange: (tenantId: string) => void;
}

interface EnhancedTenant extends Tenant {
    association: TenantAssociation;
    isPersonal: boolean;
}

const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ onAccountChange }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const { currentTenant, userTenants, isLoading } = useGlobalState();
    const [open, setOpen] = React.useState(false);

    const tenantAssociations = user?.tenants?.associations ?? {};
    const currentTenantId = user?.tenants?.context?.currentTenantId ?? null;
    const personalTenantId = user?.tenants?.context?.personalTenantId ?? null;

    const enhancedTenants = React.useMemo(() => {
        if (!Array.isArray(userTenants)) return [];

        // Sort tenants: Personal first, then by name
        return userTenants
            .map(tenant => {
                const association = tenantAssociations[tenant.tenantId];
                if (!association) return null;
                
                return {
                    ...tenant,
                    association,
                    isPersonal: tenant.tenantId === personalTenantId
                };
            })
            .filter((tenant): tenant is EnhancedTenant => 
                tenant !== null && 
                tenant.association?.status === 'active'
            )
            .sort((a, b) => {
                if (a.isPersonal) return -1;
                if (b.isPersonal) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [userTenants, tenantAssociations, personalTenantId]);

    const currentEnhancedTenant = React.useMemo(() => {
        const currentId = user?.tenants?.context?.currentTenantId;
        if (!currentId || !currentTenant) return null;

        const association = tenantAssociations[currentId];
        if (!association || association.status !== 'active') return null;

        return {
            ...currentTenant,
            association,
            isPersonal: currentId === personalTenantId
        };
    }, [currentTenant, user?.tenants?.context?.currentTenantId, tenantAssociations, personalTenantId]);

    const getIcon = (type: UserAccountTypeEnum) => {
        const iconProps = {
            className: "mr-2 h-4 w-4",
            color: theme.palette.text.primary
        };

        switch (type) {
            case UserAccountTypeEnum.PERSONAL:
                return <Person className="mr-2 h-4 w-4" color="inherit" />;
            case UserAccountTypeEnum.BUSINESS:
                return <Business className="mr-2 h-4 w-4" color="inherit" />;
            case UserAccountTypeEnum.FAMILY:
                return <Group className="mr-2 h-4 w-4" color="inherit" />;
            case UserAccountTypeEnum.INSTITUTE:
                return <School className="mr-2 h-4 w-4" color="inherit" />;
            default:
                return <Person className="mr-2 h-4 w-4" color="inherit" />;
        }
    };

    const getTenantTitle = (tenant: EnhancedTenant) => {
        if (tenant.isPersonal) {
            return `${tenant.name} (Personal)`;
        }
        return tenant.name;
    };

    const getTenantRole = (tenant: EnhancedTenant) => {
        return tenant.association.role;
    };

    const getTenantContext = (tenant: EnhancedTenant) => {
        const type = tenant.type.toLowerCase();
        const role = tenant.association.role;
        const level = tenant.association.accessLevel;
        
        if (tenant.isPersonal) {
            return `Personal Account • ${level}`;
        }
        
        return `${type} • ${role} • ${level}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-sm" 
                 style={{ color: theme.palette.text.secondary }}>
                <span className="animate-pulse">Loading tenants...</span>
            </div>
        );
    }

    return (
        <div className="relative py-2">
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 tenant-switcher-button"
                style={{
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`
                }}
            >
                <div className="flex items-center gap-2">
                    {currentEnhancedTenant ? (
                        <>
                            {getIcon(currentEnhancedTenant.type)}
                            <div>
                                <p className="font-medium" style={{ color: theme.palette.text.primary }}>
                                    {getTenantTitle(currentEnhancedTenant)}
                                </p>
                                <p className="text-xs" style={{ color: theme.palette.primary.main }}>
                                    {getTenantRole(currentEnhancedTenant)}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <Person className="mr-2 h-4 w-4" color="inherit" />
                            <div>
                                <p className="font-medium" style={{ color: theme.palette.text.primary }}>
                                    Select Account
                                </p>
                                <p className="text-xs" style={{ color: theme.palette.text.secondary }}>
                                    No account selected
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full z-50 mt-2 w-full min-w-[240px] rounded-lg p-1 shadow-lg"
                    style={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`
                    }}
                >
                    <div className="py-1">
                        <p className="px-2 py-1.5 text-xs font-medium" 
                           style={{ color: theme.palette.text.secondary }}>
                            Switch Account ({enhancedTenants.length})
                        </p>
                    </div>

                    <div className="max-h-[300px] space-y-1 overflow-y-auto">
                        {enhancedTenants.map((tenant) => (
                            <button
                                key={tenant.tenantId}
                                onClick={() => {
                                    onAccountChange(tenant.tenantId);
                                    setOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-action-hover"
                                style={{
                                    color: theme.palette.text.primary,
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {getIcon(tenant.type)}
                                    <div>
                                        <p className="font-medium" style={{ color: theme.palette.text.primary }}>
                                            {getTenantTitle(tenant)}
                                        </p>
                                        <p className="text-xs" style={{ color: theme.palette.primary.main }}>
                                            {getTenantRole(tenant)}
                                        </p>
                                        <p className="text-xs" style={{ color: theme.palette.text.secondary }}>
                                            {getTenantContext(tenant)}
                                        </p>
                                    </div>
                                </div>
                                {currentTenantId === tenant.tenantId && (
                                    <Check className="h-4 w-4" style={{ color: theme.palette.success.main }} />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="border-t py-1" style={{ borderColor: theme.palette.divider }}>
                        <button
                            onClick={() => console.log("Join new tenant")}
                            className="flex w-full items-center rounded-md px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-action-hover"
                            style={{
                                color: theme.palette.text.primary,
                            }}
                        >
                            <Group className="mr-2 h-4 w-4" color="primary" />
                            Join New Tenant
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantSwitcher;