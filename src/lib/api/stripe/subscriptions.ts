// src/lib/api_s/stripe/subscription.ts
import { SubscriptionPlanType, SubscriptionStatus } from '@/types/Subscription/types';
import axiosInstance from '@/lib/axiosSetup';
import { Subscription } from '@/types/Subscription/interfaces';
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const subscriptionsApi = {
  async get(): Promise<Subscription> {
    const response = await axiosInstance.get('/api/stripe/subscription');
    return response.data;
  },

  async update(subscriptionPlanType: SubscriptionPlanType): Promise<Subscription> {
    const plan = SUBSCRIPTION_PLANS[subscriptionPlanType];
    if (!plan || !plan.stripePriceId) {
      messageHandler.error(`Invalid subscription plan: ${subscriptionPlanType}`);
      throw new Error(`Invalid subscription plan: ${subscriptionPlanType}`);
    }

    const response = await axiosInstance.put('/api/stripe/subscription', { 
      stripePriceId: plan.stripePriceId,
      planType: subscriptionPlanType
    });

    messageHandler.success('Subscription updated successfully');
    return response.data;
  },

  async cancel(): Promise<Subscription> {
    const response = await axiosInstance.delete('/api/stripe/subscription');
    messageHandler.success('Subscription cancelled successfully');
    return {
      ...response.data,
      status: SubscriptionStatus.Canceled
    };
  },

  async createPayAsYouGoSession(): Promise<{ sessionUrl: string }> {
    const response = await axiosInstance.post('/api/stripe/create-payg-session');
    messageHandler.success('Pay-as-you-go session created');
    return response.data;
  },

  async getUsage(): Promise<{ currentUsage: number, billingPeriodEnd: string }> {
    const response = await axiosInstance.get('/api/stripe/usage');
    return response.data;
  }
};