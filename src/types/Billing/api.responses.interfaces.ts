// src/types/Billing/api.responses.interfaces.ts
import { PaymentStatus, ResourceMetrics, BillingCostItem, SubscriptionStatus, BillingCycle } from './types.shared';
import { SubscriptionPlanType } from "../Subscription/types";

export interface InvoiceResponse {
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface BillingAPIResponse {
  subscription: {
    id: string;
    plan: SubscriptionPlanType;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    nextBillingDate: string;
  };
  usage: ResourceMetrics;
  costs: BillingCostItem[];
  totalCost: number;
  currency: string;
}

// Add any other response interfaces