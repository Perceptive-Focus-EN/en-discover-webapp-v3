// src/MonitoringSystem/constants/errors/integrationErrors.ts
export enum IntegrationError {
  // API Integration
  API_REQUEST_FAILED = 'integration/api/request_failed',
  API_RESPONSE_ERROR = 'integration/api/response_error',
  API_RATE_LIMIT = 'integration/api/rate_limit',
  API_RESPONSE_INVALID = 'integration/api/response_invalid',
  API_CALLS_EXCEEDED = 'integration/api/calls_exceeded',
  API_LATENCY_EXCEEDED = 'integration/api/latency_exceeded',

  // Webhook Integration
  WEBHOOK_DELIVERY_FAILED = 'integration/webhook/delivery_failed',
  WEBHOOK_INVALID_SIGNATURE = 'integration/webhook/invalid_signature',
  WEBHOOK_PROCESSING_FAILED = 'integration/webhook/processing_failed',
    WEBHOOK_VALIDATION_FAILED = 'integration/webhook/validation_failed',
    WEBHOOK_DELIVERY_TIMEOUT = 'integration/webhook/delivery_timeout',

  
  // External Service Integration
  SERVICE_UNAVAILABLE = 'integration/service/unavailable',
    SERVICE_TIMEOUT = 'integration/service/timeout',
    SERVICE_UNREACHABLE = 'integration/service/unreachable',
    SERVICE_INVALID_RESPONSE = 'integration/service/invalid_response',
    SERVICE_RESPONSE_TIMEOUT = 'integration/service/response_timeout',
    SERVICE_RESPONSE_INVALID = 'integration/service/response_invalid',
    SERVICE_RESPONSE_ERROR = 'integration/service/response_error',
    SERVICE_RESPONSE_FAILED = 'integration/service/response_failed',
    SERVICE_RESPONSE_UNAVAILABLE = 'integration/service/response_unavailable',
    
// Integration/Redis
REDIS_HIT_RATE = 'integration/redis/hit_rate',
    REDIS_MISS_RATE = 'integration/redis/miss_rate',

    
  


}