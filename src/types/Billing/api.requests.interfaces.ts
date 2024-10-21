// src/types/Billing/api.requests.interfaces.ts
import { BillingCycle, ResourceMetrics } from './types.shared';
import { SubscriptionPlanType } from "../Subscription/types";

export interface CreateInvoiceRequest {
  customerId: string;
  amount: number;
  billingCycle: BillingCycle;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  subscriptionPlan?: SubscriptionPlanType;
  billingCycle?: BillingCycle;
}

export interface OptimizeStorageRequest {
  userId: string;
  tenantId: string;
}

// Add any other request interfaces