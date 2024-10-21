import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { SubscriptionPlanType } from '../types/Subscription/types';
import { Subscription } from '../types/Subscription/interfaces';
import { subscriptionsApi } from '../lib/api_s/stripe/subscriptions';
import { invoicesApi } from '../lib/api_s/stripe/invoices';
import { checkoutApi } from '../lib/api_s/stripe/checkout';

type SubscriptionState = {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
};

type SubscriptionAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Subscription }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'CLEAR_SUBSCRIPTION' };

const initialState: SubscriptionState = {
  subscription: null,
  loading: false,
  error: null,
};

function subscriptionReducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, subscription: action.payload, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_SUBSCRIPTION':
      return { ...state, subscription: null };
    default:
      return state;
  }
}

export interface SubscriptionContextType extends SubscriptionState {
  createSubscription: (subscriptionPlanType: SubscriptionPlanType) => Promise<void>;
  updateSubscription: (newSubscriptionPlanType: SubscriptionPlanType) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  createCheckoutSession: (data: { subscriptionPlanType: SubscriptionPlanType; successUrl: string; cancelUrl: string }) => Promise<{ sessionId: string; url: string }>;
  getInvoices: () => Promise<any>;
  getUpcomingInvoice: () => Promise<any>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);

  const fetchSubscription = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await subscriptionsApi.get();
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Failed to fetch subscription data' });
    }
  }, []);

  const createSubscription = useCallback(async (subscriptionPlanType: SubscriptionPlanType) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await subscriptionsApi.update(subscriptionPlanType);
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Failed to create subscription' });
      throw err;
    }
  }, []);

  const updateSubscription = useCallback(async (newSubscriptionPlanType: SubscriptionPlanType) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await subscriptionsApi.update(newSubscriptionPlanType);
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Failed to update subscription' });
      throw err;
    }
  }, []);

  const cancelSubscription = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      await subscriptionsApi.cancel();
      dispatch({ type: 'CLEAR_SUBSCRIPTION' });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: 'Failed to cancel subscription' });
      throw err;
    }
  }, []);

  const createCheckoutSession = useCallback(async (data: { subscriptionPlanType: SubscriptionPlanType; successUrl: string; cancelUrl: string }) => {
    return checkoutApi.createSession(data);
  }, []);

  const getInvoices = useCallback(async () => {
    return invoicesApi.getAll();
  }, []);

  const getUpcomingInvoice = useCallback(async () => {
    return invoicesApi.getUpcoming();
  }, []);

  const value: SubscriptionContextType = {
    ...state,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    refreshSubscription: fetchSubscription,
    createCheckoutSession,
    getInvoices,
    getUpcomingInvoice,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};