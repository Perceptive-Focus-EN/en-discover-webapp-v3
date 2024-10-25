// src/MonitoringSystem/constants/errors/businessErrors.ts


// NOT_FOUND: 'business/response/not_found',                 // Resource not found
    //   BAD_REQUEST: 'business/response/bad_request',             // Invalid client request
    //   CREATED: 'business/response/created',                     // Resource created successfully
    //   OK: 'business/response/ok',                               // Successful response
    //   ACCEPTED: 'business/response/accepted',                   // Request accepted but not processed yet
    //   NO_CONTENT: 'business/response/no_content',               // Successful request with no content
    //   RESET_CONTENT: 'business/response/reset_content',         // Reset content as part of a response
    //   PARTIAL_CONTENT: 'business/response/partial_content',  
// 
// 
export enum BusinessError {
  // User Management
  USER_NOT_FOUND = 'business/user/not_found',
  USER_CREATE_FAILED = 'business/user/create_failed',
  USER_UPDATE_FAILED = 'business/user/update_failed',
  
  // Tenant Management
  TENANT_NOT_FOUND = 'business/tenant/not_found',
  TENANT_LIMIT_REACHED = 'business/tenant/limit_reached',
  
  // Subscription Management
  SUBSCRIPTION_CREATE_FAILED = 'business/subscription/create_failed',
  SUBSCRIPTION_UPDATE_FAILED = 'business/subscription/update_failed',
  SUBSCRIPTION_CANCEL_FAILED = 'business/subscription/cancel_failed',
  SUBSCRIPTION_EXPIRED = 'business/subscription/expired',
  
  // Payment Processing
  PAYMENT_PROCESSING_FAILED = 'business/payment/processing_failed',
  PAYMENT_INVALID_CARD = 'business/payment/invalid_card',
  PAYMENT_INSUFFICIENT_FUNDS = 'business/payment/insufficient_funds',
  
  // Resource Management
  RESOURCE_LIMIT_EXCEEDED = 'business/resource/limit_exceeded',
  
  // Onboarding
  ONBOARDING_FAILED = 'business/onboarding/failed',
  
  // Notification System
  NOTIFICATION_SEND_FAILED = 'business/notification/send_failed',
  NOTIFICATION_INVALID_TEMPLATE = 'business/notification/invalid_template',
  NOTIFICATION_DELIVERY_FAILED = 'business/notification/delivery_failed',
  
  // Feature Flags
  FEATURE_FLAG_NOT_FOUND = 'business/feature_flag/not_found',
  FEATURE_FLAG_INVALID_CONFIG = 'business/feature_flag/invalid_config',
  
  // Logging System
  LOGGING_WRITE_FAILED = 'business/logging/write_failed',
  LOGGING_INVALID_FORMAT = 'business/logging/invalid_format',
  
  // Metrics System
  METRICS_COLLECTION_FAILED = 'business/metrics/collection_failed',
    METRICS_INVALID_FORMAT = 'business/metrics/invalid_format',
    
 POST_CREATION_SUCCESS = 'business/post/creation_success',
  POST_CREATION_FAILURE = 'business/post/creation_failure',
    
  VALIDATION_FAILED = 'business/validation/failed',
  UPLOAD_FAILED = "UPLOAD_FAILED",
  GENERATE_TEXT_FAILURE = "GENERATE_TEXT_FAILURE",

}
