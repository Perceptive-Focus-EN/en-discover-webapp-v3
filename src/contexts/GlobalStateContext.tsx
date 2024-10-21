import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { TenantInfo } from '@/types/Tenant/interfaces';
import { useAuth } from './AuthContext';

interface GlobalState {
  currentTenant: TenantInfo | null;
  userTenants: TenantInfo[];
  isLoading: boolean;
  setCurrentTenant: (tenant: TenantInfo) => void;
  fetchUserTenants: () => Promise<void>;
  selectTenant: (tenantId: string) => void;
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

export const GlobalStateProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { user, getUserTenants, switchTenant } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [userTenants, setUserTenants] = useState<TenantInfo[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserTenants = useCallback(async () => {
    if (user) {
      const now = Date.now();
      if (!lastFetchTime || now - lastFetchTime > 60000) {
        setIsLoading(true);
        try {
          const tenants = await getUserTenants();
          setUserTenants(tenants);
          setLastFetchTime(now);
          if (!currentTenant && tenants.length > 0) {
            setCurrentTenant(tenants[0]);
          }
        } catch (error) {
          console.error('Failed to fetch user tenants:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [user, getUserTenants, lastFetchTime, currentTenant]);

  const debouncedFetchUserTenants = useCallback(
    debounce(() => {
      fetchUserTenants();
    }, 1000),
    [fetchUserTenants]
  );

  useEffect(() => {
    debouncedFetchUserTenants();
    return () => {
      debouncedFetchUserTenants.cancel();
    };
  }, [user, debouncedFetchUserTenants]);

  const selectTenant = useCallback(async (tenantId: string) => {
    const tenant = userTenants.find(t => t.tenantId === tenantId);
    if (tenant) {
      setIsLoading(true);
      try {
        await switchTenant(tenantId);
        setCurrentTenant(tenant);
      } catch (error) {
        console.error('Failed to switch tenant:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [userTenants, switchTenant]);

  useEffect(() => {
    if (user?.currentTenantId && userTenants.length > 0) {
      const tenant = userTenants.find(t => t.tenantId === user.currentTenantId);
      setCurrentTenant(tenant || null);
    }
  }, [user, userTenants]);

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