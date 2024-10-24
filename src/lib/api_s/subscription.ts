// src/lib/api_s/subscription.ts
import axiosInstance from '../axiosSetup';
import { API_ENDPOINTS } from '../../constants/endpointsConstants';
import { SubscriptionPlanType } from '../../types/Subscription/types';
import { Subscription, SubscriptionStatus } from '../../types/Subscription/interfaces';
import { messageHandler } from '@/MonitoringSystem/managers/FrontendMessageHandler';

export const subscriptionApi = {
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_SUBSCRIPTION_STATUS);
    return response.data;
  },

  createCheckoutSession: async (data: { 
    subscriptionPlanType: SubscriptionPlanType; 
    successUrl: string; 
    cancelUrl: string 
  }) => {
    const response = await axiosInstance.post('/api/stripe/create-checkout-session', data);
    messageHandler.success('Checkout session created');
    return response.data;
  },

  getSubscription: async (): Promise<Subscription> => {
    const response = await axiosInstance.get(API_ENDPOINTS.GET_SUBSCRIPTION_STATUS);
    return response.data;
  },

  createSubscription: async (data: { subscriptionPlanType: SubscriptionPlanType }): Promise<Subscription> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CREATE_SUBSCRIPTION, data);
    messageHandler.success('Subscription created successfully');
    return response.data;
  },

  updateSubscription: async (data: { 
    subscriptionPlanType: SubscriptionPlanType; 
    tenantId: string 
  }): Promise<Subscription> => {
    const response = await axiosInstance.put(API_ENDPOINTS.UPDATE_SUBSCRIPTION, data);
    messageHandler.success('Subscription updated successfully');
    return response.data;
  },

  cancelSubscription: async (): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINTS.CANCEL_SUBSCRIPTION);
    messageHandler.success('Subscription cancelled successfully');
  }
};