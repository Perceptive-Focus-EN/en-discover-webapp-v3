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
    [BusinessError.RESOURCE_LIMIT_EXCEEDED]: {
        error: 'Resource limit exceeded',
        warn: 'Approaching resource limit',
        info: 'Resource usage checked'
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

    [BusinessError.USER_UPDATE_FAILED]: {
        error: 'Failed to update user',
        warn: 'User update issues detected',
        info: 'User update attempted'
    },

    [BusinessError.UPLOAD_FAILED]: {
        error: 'Failed to upload file',
        warn: 'File upload issues detected',
        info: 'File upload attempted'
    },

    [BusinessError.GENERATE_TEXT_FAILURE]: {
        error: 'Failed to generate text',
        warn: 'Text generation issues detected',
        info: 'Text generation attempted'
    },

} as const;