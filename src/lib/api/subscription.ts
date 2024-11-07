// src/lib/api_s/subscription.ts
import { api } from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { SubscriptionPlanType } from '../../types/Subscription/types';
import { Subscription, SubscriptionStatus } from '../../types/Subscription/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

interface CheckoutSessionData {
  subscriptionPlanType: SubscriptionPlanType;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export const subscriptionApi = {
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    return api.get<SubscriptionStatus>(API_ENDPOINTS.GET_SUBSCRIPTION_STATUS);
  },

  createCheckoutSession: async (data: CheckoutSessionData): Promise<CheckoutSessionResponse> => {
    const response = await api.post<CheckoutSessionResponse>(
      '/api/stripe/create-checkout-session',
      data
    );
    messageHandler.success('Checkout session created');
    return response;
  },

  getSubscription: async (): Promise<Subscription> => {
    return api.get<Subscription>(API_ENDPOINTS.GET_SUBSCRIPTION_STATUS);
  },

  createSubscription: async (data: { 
    subscriptionPlanType: SubscriptionPlanType 
  }): Promise<Subscription> => {
    const response = await api.post<Subscription>(
      API_ENDPOINTS.CREATE_SUBSCRIPTION,
      data
    );
    messageHandler.success('Subscription created successfully');
    return response;
  },

  updateSubscription: async (data: { 
    subscriptionPlanType: SubscriptionPlanType;
    tenantId: string;
  }): Promise<Subscription> => {
    const response = await api.put<Subscription>(
      API_ENDPOINTS.UPDATE_SUBSCRIPTION,
      data
    );
    messageHandler.success('Subscription updated successfully');
    return response;
  },

  cancelSubscription: async (): Promise<void> => {
    await api.delete(API_ENDPOINTS.CANCEL_SUBSCRIPTION);
    messageHandler.success('Subscription cancelled successfully');
  }
};
