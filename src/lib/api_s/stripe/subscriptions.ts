import { SubscriptionPlanType, SubscriptionStatus } from '@/types/Subscription/types';
import axiosInstance from '@/lib/axiosSetup';
import { Subscription } from '@/types/Subscription/interfaces';
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';

export const subscriptionsApi = {
  async get(): Promise<Subscription> {
    try {
      const response = await axiosInstance.get('/api/stripe/subscription');
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  },

  async update(subscriptionPlanType: SubscriptionPlanType): Promise<Subscription> {
    const plan = SUBSCRIPTION_PLANS[subscriptionPlanType];
    if (!plan || !plan.stripePriceId) {
      throw new Error(`Invalid subscription plan: ${subscriptionPlanType}`);
    }
    try {
      const response = await axiosInstance.put('/api/stripe/subscription', { 
        stripePriceId: plan.stripePriceId,
        planType: subscriptionPlanType
      });
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Failed to update subscription');
    }
  },

  async cancel(): Promise<Subscription> {
    try {
      const response = await axiosInstance.delete('/api/stripe/subscription');
      return {
        ...response.data,
        status: SubscriptionStatus.Canceled
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  },

  async createPayAsYouGoSession(): Promise<{ sessionUrl: string }> {
    try {
      const response = await axiosInstance.post('/api/stripe/create-payg-session');
      return response.data;
    } catch (error) {
      console.error('Error creating pay-as-you-go session:', error);
      throw new Error('Failed to create pay-as-you-go session');
    }
  },

  async getUsage(): Promise<{ currentUsage: number, billingPeriodEnd: string }> {
    try {
      const response = await axiosInstance.get('/api/stripe/usage');
      return response.data;
    } catch (error) {
      console.error('Error fetching usage data:', error);
      throw new Error('Failed to fetch usage data');
    }
  }
};