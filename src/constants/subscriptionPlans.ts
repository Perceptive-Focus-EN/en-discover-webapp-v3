import { SubscriptionPlanType } from '@/types/Subscription/types';

interface SubscriptionDetails {
  name: string;
  price: number;
  stripePriceId: string | undefined;
  billingCycle: 'pay-as-you-go' | 'one-time' | 'monthly' | 'annual';
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionDetails> = {
  [SubscriptionPlanType.PAY_AS_YOU_GO]: {
    name: 'Pay As You Go',
    price: 0,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PAYG_PLAN_ID,
    billingCycle: 'pay-as-you-go',
  },
  [SubscriptionPlanType.ONE_TIME_PURCHASE]: {
    name: 'One-Time Purchase',
    price: 199,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ONE_TIME_PURCHASE_ID,
    billingCycle: 'one-time',
  },
  [SubscriptionPlanType.MONTHLY_SUBSCRIPTION]: {
    name: 'Monthly Subscription',
    price: 29,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PLAN_ID,
    billingCycle: 'monthly',
  },
  [SubscriptionPlanType.ANNUAL_SUBSCRIPTION]: {
    name: 'Annual Subscription',
    price: 299,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PLAN_ID,
    billingCycle: 'annual',
  },
};