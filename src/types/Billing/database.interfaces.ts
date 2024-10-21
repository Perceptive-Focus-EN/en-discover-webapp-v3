// src/types/Billing/database.interfaces.ts
import { BillingCycle, PaymentStatus, ResourceMetrics, SubscriptionStatus } from './types.shared';
import { SubscriptionPlanType } from "../Subscription/types";

export interface InvoiceRecord {
  _id: string;
  customerId: string;
  amount: number;
  billingCycle: BillingCycle;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingRecord {
  _id: string;
  userId: string;
  tenantId: string;
  stripeCustomerId: string;
  subscriptionId: string;
  subscriptionPlan: SubscriptionPlanType;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  usage: ResourceMetrics;
  lastBillingDate: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

// Add any other database-related interfaces