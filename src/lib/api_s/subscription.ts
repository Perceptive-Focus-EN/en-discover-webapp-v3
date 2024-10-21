import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { SubscriptionPlanType } from '../../types/Subscription/types';
import { Subscription, SubscriptionStatus } from '../../types/Subscription/interfaces';

export const subscriptionApi = {
  getSubscriptionStatus: (): Promise<SubscriptionStatus> =>
    axiosInstance.get(API_ENDPOINTS.GET_SUBSCRIPTION_STATUS),

  createCheckoutSession: (data: { subscriptionPlanType: SubscriptionPlanType; successUrl: string; cancelUrl: string }) =>
    axiosInstance.post('/api/stripe/create-checkout-session', data),

  getSubscription: (): Promise<Subscription> =>
    axiosInstance.get(API_ENDPOINTS.GET_SUBSCRIPTION_STATUS),

  createSubscription: (data: { subscriptionPlanType: SubscriptionPlanType }): Promise<Subscription> =>
    axiosInstance.post(API_ENDPOINTS.CREATE_SUBSCRIPTION, data),

  updateSubscription: (data: { subscriptionPlanType: SubscriptionPlanType; tenantId: string }): Promise<Subscription> =>
    axiosInstance.put(API_ENDPOINTS.UPDATE_SUBSCRIPTION, data),

  cancelSubscription: (): Promise<void> =>
    axiosInstance.delete(API_ENDPOINTS.CANCEL_SUBSCRIPTION),
};