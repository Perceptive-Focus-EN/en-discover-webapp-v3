// src/components/TenantSwitcher.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AccountSwitcher from './AccountSwitcher';
import { useGlobalState } from '@/contexts/GlobalStateContext';
// import { TenantInfo } from '@/types/Tenant/interfaces';

interface TenantSwitcherProps {
    onAccountChange: (tenantId: string) => void;
}

const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ onAccountChange }) => {
    const { user } = useAuth();
const { currentTenant, userTenants, setCurrentTenant, fetchUserTenants, isLoading } = useGlobalState();    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTenants = async () => {
            if (user) {
                setLoading(true);
                setError(null);
                try {
                    await fetchUserTenants();
                } catch (error) {
                    console.error('Failed to fetch tenants:', error);
                    setError('Failed to fetch tenants. Please try again later.');
                } finally {
                    setLoading(false);
                }
            }
        };

        loadTenants();
    }, [user, fetchUserTenants]);

    const handleAccountChange = useCallback((tenantId: string) => {
    const newTenant = userTenants.find(tenant => tenant.tenantId === tenantId);
    if (newTenant) {
        setCurrentTenant(newTenant);
    }
    onAccountChange(tenantId);
    }, [userTenants, onAccountChange]);

    // const handleAccountChange = useCallback((tenantId: string) => {
        // const newTenant = Array.isArray(userTenants)
            // ? userTenants.find(tenant => tenant.tenantId === tenantId)
            // : null;
        // if (newTenant) {
            // setCurrentTenant(newTenant);
            // onAccountChange(tenantId);
        // }
    // }, [userTenants, setCurrentTenant, onAccountChange]);


    const handleAddAccount = () => {
        // Implement the add account functionality here
        console.log('Add account functionality not implemented');
    };

    if (loading) {
        return <div>Loading tenants...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const tenantsArray = Array.isArray(userTenants) ? userTenants : [];

    return (
        <AccountSwitcher
            tenants={tenantsArray.map(tenant => ({ ...tenant, title: tenant.name }))}
            currentTenantId={currentTenant?.tenantId || null}
            onAccountChange={handleAccountChange}
            onAddAccount={handleAddAccount}
        />
    );
};

export default TenantSwitcher;