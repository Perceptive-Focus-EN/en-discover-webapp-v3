import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { Tenant } from '@/types/Tenant/interfaces';
import { useAuth } from './AuthContext';
import { TenantAssociation } from '@/types/User/interfaces';

// Enhanced tenant type to include association data
interface EnhancedTenant extends Tenant {
    association: TenantAssociation;
    isPersonal: boolean;
}

interface GlobalState {
    currentTenant: EnhancedTenant | null;
    userTenants: EnhancedTenant[];
    isLoading: boolean;
    setCurrentTenant: (tenant: EnhancedTenant) => void;
    fetchUserTenants: () => Promise<void>;
    selectTenant: (tenantId: string) => Promise<void>;
    userId: string | null;
}

const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (context === undefined) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
};

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, getUserTenants, switchTenant } = useAuth();
    const [currentTenant, setCurrentTenant] = useState<EnhancedTenant | null>(null);
    const [userTenants, setUserTenants] = useState<EnhancedTenant[]>([]);
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const enhanceTenant = useCallback((tenant: Tenant): EnhancedTenant | null => {
        if (!user?.tenants?.associations[tenant.tenantId]) return null;

        return {
            ...tenant,
            association: user.tenants.associations[tenant.tenantId],
            isPersonal: tenant.tenantId === user?.tenants?.context?.personalTenantId
        };
    }, [user]);

    const fetchUserTenants = useCallback(async () => {
        if (!user) return;

        try {
            const now = Date.now();
            if (!lastFetchTime || now - lastFetchTime > 60000) {
                setIsLoading(true);
                const tenants = await getUserTenants();
                
                // Enhance tenants with association data
                const enhancedTenants = tenants
                    .map(tenant => enhanceTenant(tenant))
                    .filter((tenant): tenant is EnhancedTenant => tenant !== null)
                    .sort((a, b) => {
                        if (a.isPersonal) return -1;
                        if (b.isPersonal) return 1;
                        return a.name.localeCompare(b.name);
                    });

                setUserTenants(enhancedTenants);
                setLastFetchTime(now);

                if (!currentTenant && enhancedTenants.length > 0) {
                    const defaultTenant = enhancedTenants.find(t => t.isActive) || enhancedTenants[0];
                    setCurrentTenant(defaultTenant);
                }
            }
        } catch (error) {
            console.error('Error fetching tenants:', error);
            setUserTenants([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, getUserTenants, lastFetchTime, currentTenant, enhanceTenant]);

    const debouncedFetchUserTenants = useCallback(
        debounce(() => {
            fetchUserTenants();
        }, 1000),
        [fetchUserTenants]
    );

    const selectTenant = useCallback(
        async (tenantId: string) => {
            const tenant = userTenants.find((t) => t.tenantId === tenantId);
            if (tenant?.isActive) {
                setIsLoading(true);
                try {
                    await switchTenant(tenantId);
                    setCurrentTenant(tenant);
                } catch (error) {
                    console.error('Error switching tenant:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        },
        [userTenants, switchTenant]
    );

    useEffect(() => {
        if (user?.tenants?.context?.currentTenantId && userTenants.length > 0) {
            const tenant = userTenants.find(
                (t) => t.tenantId === user.tenants.context.currentTenantId
            );
            if (tenant?.isActive) {
                setCurrentTenant(tenant);
            }
        }
    }, [user, userTenants]);

    useEffect(() => {
        debouncedFetchUserTenants();
        return () => {
            debouncedFetchUserTenants.cancel();
        };
    }, [user, debouncedFetchUserTenants]);

    const value = {
        currentTenant,
        userTenants,
        isLoading,
        setCurrentTenant,
        fetchUserTenants,
        selectTenant,
        userId: user?.userId || null,
    };

    return (
        <GlobalStateContext.Provider value={value}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export { GlobalStateContext };