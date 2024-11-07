// src/MonitoringSystem/constants/messages/businessMessages.ts
import { BusinessError } from '../errors/businessErrors';

export const BusinessMessages = {
    // User Management
    [BusinessError.USER_NOT_FOUND]: {
        error: 'User not found',
        warn: 'User lookup failed',
        info: 'User search performed'
    },
    [BusinessError.USER_CREATE_FAILED]: {
        error: 'Failed to create user',
        warn: 'User creation issues detected',
        info: 'User creation attempted'
    },
    [BusinessError.USER_UPDATE_FAILED]: {
        error: 'Failed to update user',
        warn: 'User update issues detected',
        info: 'User update attempted'
    },
    
    // Tenant Management
    [BusinessError.TENANT_NOT_FOUND]: {
        error: 'Tenant not found',
        warn: 'Tenant lookup failed',
        info: 'Tenant search performed'
    },
    [BusinessError.TENANT_LIMIT_REACHED]: {
        error: 'Tenant limit reached',
        warn: 'Approaching tenant limit',
        info: 'Tenant limit checked'
    },
    [BusinessError.TENANT_CREATE_FAILED]: {
        error: 'Failed to create tenant',
        warn: 'Tenant creation issues detected',
        info: 'Tenant creation attempted'
    },
    [BusinessError.TENANT_UPDATE_FAILED]: {
        error: 'Failed to update tenant',
        warn: 'Tenant update issues detected',
        info: 'Tenant update attempted'
    },
    [BusinessError.TENANT_DELETE_FAILED]: {
        error: 'Failed to delete tenant',
        warn: 'Tenant deletion issues detected',
        info: 'Tenant deletion attempted'
    },
    [BusinessError.TENANT_SUSPEND_FAILED]: {
        error: 'Failed to suspend tenant',
        warn: 'Tenant suspension issues detected',
        info: 'Tenant suspension attempted'
    },
    [BusinessError.TENANT_REACTIVATE_FAILED]: {
        error: 'Failed to reactivate tenant',
        warn: 'Tenant reactivation issues detected',
        info: 'Tenant reactivation attempted'
    },
    [BusinessError.TENANT_INVALID_NAME]: {
        error: 'Invalid tenant name',
        warn: 'Tenant name validation failed',
        info: 'Tenant name validation performed'
    },
    [BusinessError.TENANT_INVALID_DOMAIN]: {
        error: 'Invalid tenant domain',
        warn: 'Tenant domain validation failed',
        info: 'Tenant domain validation performed'
    },
    [BusinessError.TENANT_INVALID_EMAIL]: {
        error: 'Invalid tenant email',
        warn: 'Tenant email validation failed',
        info: 'Tenant email validation performed'
    },
    [BusinessError.TENANT_INVALID_INDUSTRY]: {
        error: 'Invalid tenant industry',
        warn: 'Tenant industry validation failed',
        info: 'Tenant industry validation performed'
    },
    [BusinessError.TENANT_INVALID_TYPE]: {
        error: 'Invalid tenant type',
        warn: 'Tenant type validation failed',
        info: 'Tenant type validation performed'
    },
    [BusinessError.TENANT_INVALID_STATUS]: {
        error: 'Invalid tenant status',
        warn: 'Tenant status validation failed',
        info: 'Tenant status validation performed'
    },
    [BusinessError.TENANT_INVALID_OWNER]: {
        error: 'Invalid tenant owner',
        warn: 'Tenant owner validation failed',
        info: 'Tenant owner validation performed'
    },
    [BusinessError.TENANT_INVALID_DETAILS]: {
        error: 'Invalid tenant details',
        warn: 'Tenant details validation failed',
        info: 'Tenant details validation performed'
    },
    [BusinessError.TENANT_INVALID_SETTINGS]: {
        error: 'Invalid tenant settings',
        warn: 'Tenant settings validation failed',
        info: 'Tenant settings validation performed'
    },
    [BusinessError.TENANT_INVALID_JOIN_REQUESTS]: {
        error: 'Invalid tenant join requests',
        warn: 'Tenant join requests validation failed',
        info: 'Tenant join requests validation performed'
    },
    [BusinessError.TENANT_INVALID_USER_LIMITS]: {
        error: 'Invalid tenant user limits',
        warn: 'Tenant user limits validation failed',
        info: 'Tenant user limits validation performed'
    },
    [BusinessError.TENANT_INVALID_SECURITY]: {
        error: 'Invalid tenant security settings',
        warn: 'Tenant security settings validation failed',
        info: 'Tenant security settings validation performed'
    },

    // Account Management
    [BusinessError.ACCOUNT_UPDATE_FAILED]: {
        error: 'Failed to update account',
        warn: 'Account update issues detected',
        info: 'Account update attempted'
    },
    [BusinessError.ACCOUNT_DELETE_FAILED]: {
        error: 'Failed to delete account',
        warn: 'Account deletion issues detected',
        info: 'Account deletion attempted'
    },
    [BusinessError.ACCOUNT_SUSPEND_FAILED]: {
        error: 'Failed to suspend account',
        warn: 'Account suspension issues detected',
        info: 'Account suspension attempted'
    },
    [BusinessError.ACCOUNT_REACTIVATE_FAILED]: {
        error: 'Failed to reactivate account',
        warn: 'Account reactivation issues detected',
        info: 'Account reactivation attempted'
    },
    [BusinessError.ACCOUNT_INVALID_NAME]: {
        error: 'Invalid account name',
        warn: 'Account name validation failed',
        info: 'Account name validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_TYPE]: {
        error: 'Invalid account type',
        warn: 'Account type validation failed',
        info: 'Account type validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_STATUS]: {
        error: 'Invalid account status',
        warn: 'Account status validation failed',
        info: 'Account status validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_INDUSTRY]: {
        error: 'Invalid account industry',
        warn: 'Account industry validation failed',
        info: 'Account industry validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_OWNER]: {
        error: 'Invalid account owner',
        warn: 'Account owner validation failed',
        info: 'Account owner validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_SUBSCRIPTION]: {
        error: 'Invalid account subscription',
        warn: 'Account subscription validation failed',
        info: 'Account subscription validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_SUBSCRIPTION_STATUS]: {
        error: 'Invalid account subscription status',
        warn: 'Account subscription status validation failed',
        info: 'Account subscription status validation performed'
    },
    [BusinessError.ACCOUNT_INVALID_SUBSCRIPTION_TYPE]: {
        error: 'Invalid account subscription type',
        warn: 'Account subscription type validation failed',
        info: 'Account subscription type validation performed'
    },



    // Subscription Management
    [BusinessError.SUBSCRIPTION_CREATE_FAILED]: {
        error: 'Failed to create subscription',
        warn: 'Subscription creation issues',
        info: 'Subscription creation attempted'
    },
    [BusinessError.SUBSCRIPTION_UPDATE_FAILED]: {
        error: 'Failed to update subscription',
        warn: 'Subscription update issues',
        info: 'Subscription update attempted'
    },
    [BusinessError.SUBSCRIPTION_CANCEL_FAILED]: {
        error: 'Failed to cancel subscription',
        warn: 'Subscription cancellation issues',
        info: 'Subscription cancellation attempted'
    },
    [BusinessError.SUBSCRIPTION_EXPIRED]: {
        error: 'Subscription has expired',
        warn: 'Subscription nearing expiration',
        info: 'Subscription status checked'
    },

    // Payment Processing
    [BusinessError.PAYMENT_PROCESSING_FAILED]: {
        error: 'Payment processing failed',
        warn: 'Payment processing issues',
        info: 'Payment processing attempted'
    },
    [BusinessError.PAYMENT_INVALID_CARD]: {
        error: 'Invalid card details',
        warn: 'Card validation failed',
        info: 'Card validation performed'
    },
    [BusinessError.PAYMENT_INSUFFICIENT_FUNDS]: {
        error: 'Insufficient funds',
        warn: 'Payment declined',
        info: 'Payment verification performed'
    },

    // Resource Management
    [BusinessError.RESOURCE_NOT_FOUND]: {
        error: 'Resource not found',
        warn: 'Resource lookup failed',
        info: 'Resource search performed'
    },

    [BusinessError.RESOURCE_CREATE_FAILED]: {
        error: 'Failed to create resource',
        warn: 'Resource creation issues',
        info: 'Resource creation attempted'
    },

    [BusinessError.RESOURCE_UPDATE_FAILED]: {
        error: 'Failed to update resource',
        warn: 'Resource update issues',
        info: 'Resource update attempted'
    },

    [BusinessError.RESOURCE_LIMIT_EXCEEDED]: {
        error: 'Resource limit exceeded',
        warn: 'Approaching resource limit',
        info: 'Resource usage checked'
    },

    [BusinessError.RESOURCE_DELETE_FAILED]: {
        error: 'Failed to delete resource',
        warn: 'Resource deletion issues',
        info: 'Resource deletion attempted'
    },

    // Onboarding
    [BusinessError.ONBOARDING_FAILED]: {
        error: 'Onboarding process failed',
        warn: 'Onboarding issues detected',
        info: 'Onboarding step attempted'
    },

    // Notification System
    [BusinessError.NOTIFICATION_SEND_FAILED]: {
        error: 'Failed to send notification',
        warn: 'Notification delivery issues',
        info: 'Notification send attempted'
    },
    [BusinessError.NOTIFICATION_INVALID_TEMPLATE]: {
        error: 'Invalid notification template',
        warn: 'Template validation failed',
        info: 'Template validation performed'
    },
    [BusinessError.NOTIFICATION_DELIVERY_FAILED]: {
        error: 'Notification delivery failed',
        warn: 'Delivery issues detected',
        info: 'Delivery attempted'
    },

    // Feature Flags
    [BusinessError.FEATURE_FLAG_NOT_FOUND]: {
        error: 'Feature flag not found',
        warn: 'Feature flag lookup failed',
        info: 'Feature flag check performed'
    },
    [BusinessError.FEATURE_FLAG_INVALID_CONFIG]: {
        error: 'Invalid feature flag configuration',
        warn: 'Configuration validation failed',
        info: 'Configuration validation performed'
    },

    // Logging System
    [BusinessError.LOGGING_WRITE_FAILED]: {
        error: 'Failed to write logs',
        warn: 'Log writing issues',
        info: 'Log writing attempted'
    },
    [BusinessError.LOGGING_INVALID_FORMAT]: {
        error: 'Invalid log format',
        warn: 'Log format validation failed',
        info: 'Log format validation performed'
    },

    // Metrics System
    [BusinessError.METRICS_COLLECTION_FAILED]: {
        error: 'Failed to collect metrics',
        warn: 'Metrics collection issues',
        info: 'Metrics collection attempted'
    },
    [BusinessError.METRICS_INVALID_FORMAT]: {
        error: 'Invalid metrics format',
        warn: 'Metrics format validation failed',
        info: 'Metrics format validation performed'
    },

    // Post Management
    [BusinessError.POST_CREATION_SUCCESS]: {
        error: 'Post created successfully',
        warn: 'Post creation issues',
        info: 'Post creation attempted'
    },
    [BusinessError.POST_CREATION_FAILURE]: {
        error: 'Failed to create post',
        warn: 'Post creation issues',
        info: 'Post creation attempted'
    },

    // File Uploads
    [BusinessError.UPLOAD_FAILED]: {
        error: 'Failed to upload file',
        warn: 'File upload issues detected',
        info: 'File upload attempted'
    },

    // Text Generation
    [BusinessError.GENERATE_TEXT_FAILURE]: {
        error: 'Failed to generate text',
        warn: 'Text generation issues detected',
        info: 'Text generation attempted'
    },



    // Validation
    [BusinessError.VALIDATION_FAILED]: {
        error: 'Validation failed',
        warn: 'Validation issues detected',
        info: 'Validation attempted'
    },

    // Method Errors
    [BusinessError.INVALID_METHOD]: {
        error: 'Invalid method',
        warn: 'Method validation failed',
        info: 'Method validation performed'
    },

    // Parameter Errors
    [BusinessError.INVALID_PARAMETERS]: {
        error: 'Invalid parameters',
        warn: 'Parameter validation failed',
        info: 'Parameter validation performed'
    }
 
} as const;
