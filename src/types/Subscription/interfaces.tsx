import { SubscriptionPlanType } from './types';


export interface StripeCustomer {
    id: string;
    email: string;
    name: string;
    // Other Stripe customer fields
}

export interface SubscriptionStatus {
    // Subscription status fields
    isActive: boolean;
    plan: SubscriptionPlanType ;
    expirationDate: string;
}


export interface Subscription {
    id: string;
    userId: string;
    tenantId: string;
    plan: SubscriptionPlanType ;
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
}