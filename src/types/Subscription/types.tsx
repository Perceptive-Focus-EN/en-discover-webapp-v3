// types/Subscription/types.tsx


export enum SubscriptionStatus {
  Active = 'active',
  Canceled = 'canceled',
  PastDue = 'past_due',
  Unpaid = 'unpaid',
  Trialing = 'trialing'
}

export enum SubscriptionPlanType {
  PAY_AS_YOU_GO = 'PAY_AS_YOU_GO',
  ONE_TIME_PURCHASE = 'ONE_TIME_PURCHASE',
  MONTHLY_SUBSCRIPTION = 'MONTHLY_SUBSCRIPTION',
  ANNUAL_SUBSCRIPTION = 'ANNUAL_SUBSCRIPTION'
}