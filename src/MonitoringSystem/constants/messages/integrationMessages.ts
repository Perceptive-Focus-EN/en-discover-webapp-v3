// src/MonitoringSystem/constants/messages/integrationMessages.ts
import { IntegrationError } from '../errors/integrationErrors';

export const IntegrationMessages = {
  // API Integration Messages
  [IntegrationError.API_REQUEST_FAILED]: {
    error: 'API request failed',
    warn: 'API request experiencing issues',
    info: 'API request attempted'
  },
  [IntegrationError.API_RESPONSE_ERROR]: {
    error: 'API returned error response',
    warn: 'Unexpected API response received',
    info: 'API response processed'
  },
  [IntegrationError.API_RATE_LIMIT]: {
    error: 'API rate limit exceeded',
    warn: 'Approaching API rate limit',
    info: 'API rate limit checked'
  },
  [IntegrationError.API_RESPONSE_INVALID]: {
    error: 'Invalid API response format',
    warn: 'API response validation issues',
    info: 'API response validation performed'
  },

  // Webhook Integration Messages
  [IntegrationError.WEBHOOK_DELIVERY_FAILED]: {
    error: 'Failed to deliver webhook',
    warn: 'Webhook delivery issues detected',
    info: 'Webhook delivery attempted'
  },
  [IntegrationError.WEBHOOK_INVALID_SIGNATURE]: {
    error: 'Invalid webhook signature',
    warn: 'Webhook signature validation failed',
    info: 'Webhook signature verified'
  },
  [IntegrationError.WEBHOOK_PROCESSING_FAILED]: {
    error: 'Failed to process webhook',
    warn: 'Webhook processing issues detected',
    info: 'Webhook processing attempted'
  },
  [IntegrationError.WEBHOOK_VALIDATION_FAILED]: {
    error: 'Webhook validation failed',
    warn: 'Webhook payload validation issues',
    info: 'Webhook validation performed'
  },

  // External Service Integration Messages
  [IntegrationError.SERVICE_UNAVAILABLE]: {
    error: 'External service unavailable',
    warn: 'External service connectivity issues',
    info: 'External service availability checked'
  },
  [IntegrationError.SERVICE_TIMEOUT]: {
    error: 'External service timeout',
    warn: 'External service response delayed',
    info: 'External service response time monitored'
  }
} as const;