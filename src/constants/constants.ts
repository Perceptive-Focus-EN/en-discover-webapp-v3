// src/constants/index.ts

import { User } from "@/types/User/interfaces";
import { ExtendedUserInfo } from "@/types/User/interfaces";
import { AccountBalance, Business } from "@mui/icons-material";
import { PERMISSIONS } from "./AccessKey/permissions";

// Business info constants
export const DEPARTMENTS = ['SALES', 'HR', 'ENGINEERING', 'MARKETING', 'FINANCE', 'OPERATIONS', 'OTHER'] as const;
export type Department = typeof DEPARTMENTS[number];

export const INDUSTRIES = [
  'Finance',
  'Technology',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Services',
  'Other',
] as const;
export type Industry = typeof INDUSTRIES[number];

export const EMPLOYEE_COUNT = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;
export type EmployeeCount = typeof EMPLOYEE_COUNT[number];

export const ANNUAL_REVENUES = ['0-100k', '100k-500k', '500k-1m', '1m-5m', '5m+', 'ZeroToTenThousand', 'Other'] as const;
export type AnnualRevenue = typeof ANNUAL_REVENUES[number];

export const BUSINESS_GOALS = [
  'Increase revenue',
  'Reduce costs',
  'Improve customer satisfaction',
  'Increase market share',
  'Improve productivity',
  'Other',
] as const;
export type BusinessGoal = typeof BUSINESS_GOALS[number];


export const BCRYPT_SALT_ROUNDS = 10;

// API-related constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
};

// Export lists for easy access
export const DEPARTMENTS_LIST = DEPARTMENTS;
export const INDUSTRIES_LIST = INDUSTRIES;
export const EMPLOYEE_COUNT_LIST = EMPLOYEE_COUNT;
export const ANNUAL_REVENUE_LIST = ANNUAL_REVENUES;
export const BUSINESS_GOALS_LIST = BUSINESS_GOALS;




// Auth configs
export const MAX_LOGIN_ATTEMPTS = 5;
export const PASSWORD_RESET_EXPIRY = 3600000; // 1 hour in milliseconds

export const REFRESH_EXPIRY = 7 * 24 * 3600; // 7 days in seconds


export const JWT_EXPIRY = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
} as const;



// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;


export const NOTIFICATION_TYPES = ['email', 'sms', 'push'] as const;


// Audit configs
export const AUDIT_ACTIONS = [
  'CREATEUSER', 'UPDATEUSER', 'DELETEUSER', 'CREATETENANT', 'UPDATETENANT', 'DELETETENANT', 
  'CREATEINVOICE', 'UPDATEINVOICE', 'DELETEINVOICE', 'CREATEPAYMENT', 'UPDATEPAYMENT', 'DELETEPAYMENT',
  'CREATESUBSCRIPTION', 'UPDATESUBSCRIPTION', 'DELETESUBSCRIPTION', 'CREATERESOURCE', 'UPDATERESOURCE', 'DELETERESOURCE',
  'CREATENOTIFICATION', 'UPDATENOTIFICATION', 'DELETENOTIFICATION', 'CREATESETTING', 'UPDATESETTING', 'DELETESETTING', 
  'CREATEFEATUREFLAG', 'UPDATEFEATUREFLAG', 'DELETEFEATUREFLAG', 'CREATESTRIPECUSTOMER', 'UPDATESTRIPECUSTOMER', 'DELETESTRIPECUSTOMER',
  'CREATEAUDITTRAIL', 'UPDATEAUDITTRAIL', 'DELETEAUDITTRAIL', 'CREATESESSION', 'UPDATESESSION', 'DELETESESSION'
] as const;

// Geographic info
export const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 
  'Germany', 'France', 'Japan', 'China', 'India', 'Brazil', 'Other'
] as const;

export const REGIONS = ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania', 'Other'] as const;

// Stripe configs
export const STRIPE_CONFIG = {
  PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  PLANS: {
    BASIC: 'price_1234567890',
    PRO: 'price_0987654321',
    ENTERPRISE: 'price_1357924680',
  },
} as const;

export const STRIPE_EVENT_TYPES = {
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
} as const;

// Subscription configs


export const FEATURE_FLAGS = {
  BASIC: ['feature1', 'feature2'],
  PRO: ['feature1', 'feature2', 'feature3'],
  ENTERPRISE: ['feature1', 'feature2', 'feature3', 'feature4'],
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;


// User configs
export const USER_TYPES = {
  BETA: 'beta',
  TRIAL: 'trial',
  PAID: 'paid',
} as const;