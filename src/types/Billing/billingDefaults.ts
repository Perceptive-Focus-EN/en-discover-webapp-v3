// src/types/Billing/billingDefaults.ts
import { BillingAPIResponse } from './api.responses.interfaces';
import { SubscriptionStatus, BillingCycle, ResourceMetrics, BillingCostItem, ResourceTypeCost } from './types.shared';
import {SubscriptionPlanType} from '../Subscription/types';

export const DEFAULT_BILLING_DATA: BillingAPIResponse = {
  subscription: {
    id: '',
    plan: 'FREE' as SubscriptionPlanType,
    status: 'active' as SubscriptionStatus,
    billingCycle: 'monthly' as BillingCycle,
    nextBillingDate: new Date().toISOString(),
  },
  usage: {
    database: 0,
    storage: 0,
    function: 0,
  },
  costs: [],
  totalCost: 0,
  currency: 'USD',
};

// Creating a separate type for frontend use that 
// extends BillingAPIResponse with these additional fields.
// 

export const DEFAULT_EXTENDED_BILLING_DATA: ExtendedBillingData = {
  ...DEFAULT_BILLING_DATA,
  billingPeriod: {
    start: new Date().toISOString(),
    end: new Date().toISOString(),
  },
  currentUsage: {
    database: 0,
    storage: 0,
    function: 0,
  },
  costBreakdown: [],
  dailyCosts: [],
  resourceTypeCosts: [],
  lastUpdated: new Date().toISOString(),
};


export interface ExtendedBillingData extends BillingAPIResponse {
  billingPeriod: {
    start: string;
    end: string;
  };
  currentUsage: ResourceMetrics;
  costBreakdown: BillingCostItem[];
  dailyCosts: BillingCostItem[];
  resourceTypeCosts: ResourceTypeCost[];
  lastUpdated: string;
}