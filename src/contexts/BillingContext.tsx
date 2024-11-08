// src/contexts/BillingContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { subscriptionsApi, invoicesApi, checkoutApi } from '../lib/api/stripe';
import { billingApi } from '../lib/api/stripe/customBillingLogic';
import { OptimizeStorageRequest } from '../types/Billing/api.requests.interfaces';
import { DEFAULT_EXTENDED_BILLING_DATA, ExtendedBillingData } from '@/types/Billing/billingDefaults';
import { useAuth } from './AuthContext';
import { SubscriptionPlanType } from '@/types/Subscription/types';
import { SubscriptionStatus, BillingCycle } from '@/types/Billing/types.shared';

interface BillingContextType {
  data: ExtendedBillingData | null;
  loading: boolean;
  error: Error | null;
  fetchBillingData: (tenantId: string) => Promise<void>;
  optimizeUserStorage: (request: OptimizeStorageRequest) => Promise<void>;
  updateSubscription: (subscriptionPlanType: SubscriptionPlanType) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  getInvoiceHistory: () => Promise<void>;
  createCheckoutSession: (data: { subscriptionPlanType: SubscriptionPlanType; successUrl: string; cancelUrl: string }) => Promise<{ sessionId: string; url: string }>;
  clearBillingError: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

interface BillingProviderProps {
  children: React.ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ExtendedBillingData | null>(DEFAULT_EXTENDED_BILLING_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = (err: unknown, defaultMessage: string) => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage;
    setError(new Error(errorMessage));
    console.error(errorMessage, err);
  };

  const fetchBillingData = useCallback(async (tenantId: string) => {
    if (!user || !user.currentTenant || user.currentTenant.tenantId !== tenantId) {
      setError(new Error('Unauthorized access'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const billingData = await billingApi.getCustomBillingData(tenantId);
      const subscription = await subscriptionsApi.get();
      setData({ 
        ...DEFAULT_EXTENDED_BILLING_DATA, 
        ...billingData, 
        subscription: {
          ...subscription,
          status: subscription.status as SubscriptionStatus,
          billingCycle: (subscription as any).billingCycle as BillingCycle || DEFAULT_EXTENDED_BILLING_DATA.subscription.billingCycle,
          nextBillingDate: (subscription as any).nextBillingDate || DEFAULT_EXTENDED_BILLING_DATA.subscription.nextBillingDate
        }
      });
    } catch (err) {
      handleError(err, 'An error occurred while fetching billing data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const optimizeUserStorage = useCallback(async (request: OptimizeStorageRequest) => {
    if (!user || !user.currentTenant || user.currentTenant.tenantId !== request.tenantId) {
      setError(new Error('Unauthorized access'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await billingApi.optimizeStorage(request);
      if (data?.subscription.id) {
        await fetchBillingData(data.subscription.id);
      }
    } catch (err) {
      handleError(err, 'An error occurred while optimizing storage');
    } finally {
      setLoading(false);
    }
  }, [user, data, fetchBillingData]);

  const updateSubscription = useCallback(async (subscriptionPlanType: SubscriptionPlanType) => {
    if (!user) {
      setError(new Error('Unauthorized access'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updatedSubscription = await subscriptionsApi.update(subscriptionPlanType);
      setData(prevData => prevData ? {
        ...prevData,
        subscription: {
          ...prevData.subscription,
          ...updatedSubscription,
          status: updatedSubscription.status as SubscriptionStatus
        }
      } : null);
    } catch (err) {
      handleError(err, 'An error occurred while updating subscription');
    }
    finally {
      setLoading(false);
    }
  }, [user]);

    const cancelSubscription = useCallback(async () => {
    if (!user) {
      setError(new Error('Unauthorized access'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await subscriptionsApi.cancel();
      setData(prevData => prevData ? { 
        ...prevData, 
        subscription: { 
          ...prevData.subscription,
          status: 'CANCELED' as SubscriptionStatus
        } 
      } : null);
    } catch (err) {
      handleError(err, 'An error occurred while canceling subscription');
    } finally {
      setLoading(false);
    }
  }, [user]);
  const getInvoiceHistory = useCallback(async () => {
    if (!user) {
      setError(new Error('Unauthorized access'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const invoiceHistory = await invoicesApi.getAll();
      setData(prevData => prevData ? { ...prevData, invoices: invoiceHistory } : null);
    } catch (err) {
      handleError(err, 'An error occurred while fetching invoice history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCheckoutSession = useCallback(async (data: { subscriptionPlanType: SubscriptionPlanType; successUrl: string; cancelUrl: string }) => {
    if (!user) {
      throw new Error('Unauthorized access');
    }
    try {
      return await checkoutApi.createSession(data);
    } catch (err) {
      handleError(err, 'An error occurred while creating checkout session');
      throw err;
    }
  }, [user]);

  const clearBillingError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <BillingContext.Provider value={{
      data,
      loading,
      error,
      fetchBillingData,
      optimizeUserStorage,
      updateSubscription,
      cancelSubscription,
      getInvoiceHistory,
      createCheckoutSession,
      clearBillingError
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};