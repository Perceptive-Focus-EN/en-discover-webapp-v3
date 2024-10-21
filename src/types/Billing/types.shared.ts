// src/types/Billing/types.shared.ts


// Defines the billing frequency options
// Use case: When setting up a subscription plan or displaying billing options to users
export type BillingCycle = 'monthly' | 'annually';

// Represents the current state of a payment
// Use case: Tracking payment status in transaction logs or displaying payment status to users
export type PaymentStatus = 'pending' | 'completed' | 'failed';

// Indicates the current state of a subscription
// Use case: Managing subscription lifecycles or filtering active/inactive subscriptions
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended';

// Defines the types of resources that can be billed
// Use case: Categorizing usage metrics or creating resource-specific billing rules
export type ResourceType = 'database' | 'storage' | 'function';


// EDUCATIOINAL PURPOSES:
// This type is mapped like the type below it but with a different syntax
// Why you might ask? because "K" is a generic type that can be used to map any type
// Though "Key" is a generic type that can be used to map any type AS WELL!
// Main difference is that "K" is seen more often in the documentary for these mapping types vs "Key"
// Both work the same way, just learning the different ways to do the same thing will help you understand t

// export type ResourceMetrics = {
// [K in ResourceType]: number;

// VS

// export type ResourceMetrics = {
    // [key in ResourceType]: number;
// };
//

// Maps each resource type to its usage amount
// Use case: Storing or transmitting resource usage data, e.g., in API responses or database records

export type ResourceMetrics = {
    [K in ResourceType]: number;
};

// Represents a single billing cost entry
// Use case: Displaying itemized billing information or storing individual cost entries in a database
export interface BillingCostItem {
  date: string;
  cost: number;
  resourceType: ResourceType;
}

// Represents the cost associated with a specific resource type
// Use case: Creating cost breakdown visualizations or calculating resource-specific expenses
export interface ResourceTypeCost {
  name: ResourceType;
  value: number;
}