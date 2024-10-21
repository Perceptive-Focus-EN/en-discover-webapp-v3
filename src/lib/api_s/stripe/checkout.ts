import { SubscriptionPlanType } from '@/types/Subscription/types';
import axiosInstance from '@/lib/axiosSetup';
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';

export const checkoutApi = {
  async createSession(data: {
    subscriptionPlanType: SubscriptionPlanType;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    const plan = SUBSCRIPTION_PLANS[data.subscriptionPlanType];
    if (!plan || !plan.stripePriceId) {
      throw new Error(`Invalid subscription plan: ${data.subscriptionPlanType}`);
    }

    try {
      const response = await axiosInstance.post('/api/stripe/create-checkout-session', {
        subscriptionPlanType: data.subscriptionPlanType,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
        stripePriceId: plan.stripePriceId,
      });

      if (response.status !== 200) {
        throw new Error('Failed to create checkout session, unexpected response status');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  },

  async createOneTimePurchaseSession(data: {
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string; url: string }> {
    try {
      const response = await axiosInstance.post('/api/stripe/create-one-time-purchase-session', data);
      
      if (response.status !== 200) {
        throw new Error('Failed to create one-time purchase session, unexpected response status');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating one-time purchase session:', error);
      throw new Error('Failed to create one-time purchase session');
    }
  }
};