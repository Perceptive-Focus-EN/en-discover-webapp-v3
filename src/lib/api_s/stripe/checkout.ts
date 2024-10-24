// src/lib/api_s/stripe/checkout.ts
import { SubscriptionPlanType } from '@/types/Subscription/types';
import axiosInstance from '@/lib/axiosSetup';
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const checkoutApi = {
  async createSession(data: {
    subscriptionPlanType: SubscriptionPlanType;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const plan = SUBSCRIPTION_PLANS[data.subscriptionPlanType];
    if (!plan || !plan.stripePriceId) {
      messageHandler.error(`Invalid subscription plan: ${data.subscriptionPlanType}`);
      throw new Error(`Invalid subscription plan: ${data.subscriptionPlanType}`);
    }

    const response = await axiosInstance.post('/api/stripe/create-checkout-session', {
      subscriptionPlanType: data.subscriptionPlanType,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      stripePriceId: plan.stripePriceId,
    });

    messageHandler.success('Checkout session created');
    return response.data;
  },

  async createOneTimePurchaseSession(data: {
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const response = await axiosInstance.post('/api/stripe/create-one-time-purchase-session', data);
    messageHandler.success('One-time purchase session created');
    return response.data;
  }
};