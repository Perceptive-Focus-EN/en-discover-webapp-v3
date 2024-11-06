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
  USER_DELETE_FAILED = 'business/user/delete_failed',
  USER_SUSPEND_FAILED = 'business/user/suspend_failed',
  USER_REACTIVATE_FAILED = 'business/user/reactivate_failed',
  USER_INVALID_EMAIL = 'business/user/invalid_email',
  USER_ALREADY_EXISTS = 'business/user/already_exists',
  USER_INVALID_PASSWORD = 'business/user/invalid_password',
  USER_INVALID_PHONE = 'business/user/invalid_phone',
  USER_INVALID_NAME = 'business/user/invalid_name',
  USER_INVALID_ROLE = 'business/user/invalid_role',
  USER_INVALID_STATUS = 'business/user/invalid_status',
  USER_INVALID_ACCOUNT_TYPE = 'business/user/invalid_account_type',
  USER_INVALID_DEPARTMENT = 'business/user/invalid_department',
  USER_INVALID_TENANT = 'business/user/invalid_tenant',
  USER_INVALID_INVITE_CODE = 'business/user/invalid_invite_code',
  USER_INVALID_TENANT_ROLE = 'business/user/invalid_tenant_role',
  USER_INVALID_ACCESS_LEVEL = 'business/user/invalid_access_level',
  USER_INVALID_PERMISSIONS = 'business/user/invalid_permissions',
  USER_INVALID_SUBSCRIPTION = 'business/user/invalid_subscription',
  USER_INVALID_SUBSCRIPTION_STATUS = 'business/user/invalid_subscription_status',
  USER_INVALID_SUBSCRIPTION_TYPE = 'business/user/invalid_subscription_type',
  USER_INVALID_SUBSCRIPTION_PLAN = 'business/user/invalid_subscription_plan',
  USER_INVALID_SUBSCRIPTION_PAYMENT = 'business/user/invalid_subscription_payment',

  // Account Management
  ACCOUNT_NOT_FOUND = 'business/account/not_found',
  ACCOUNT_CREATE_FAILED = 'business/account/create_failed',
  ACCOUNT_UPDATE_FAILED = 'business/account/update_failed',
  ACCOUNT_DELETE_FAILED = 'business/account/delete_failed',
  ACCOUNT_SUSPEND_FAILED = 'business/account/suspend_failed',
  ACCOUNT_REACTIVATE_FAILED = 'business/account/reactivate_failed',
  ACCOUNT_INVALID_NAME = 'business/account/invalid_name',
  ACCOUNT_INVALID_TYPE = 'business/account/invalid_type',
  ACCOUNT_INVALID_STATUS = 'business/account/invalid_status',
  ACCOUNT_INVALID_INDUSTRY = 'business/account/invalid_industry',
  ACCOUNT_INVALID_OWNER = 'business/account/invalid_owner',
  ACCOUNT_INVALID_SUBSCRIPTION = 'business/account/invalid_subscription',
  ACCOUNT_INVALID_SUBSCRIPTION_STATUS = 'business/account/invalid_subscription_status',
  ACCOUNT_INVALID_SUBSCRIPTION_TYPE = 'business/account/invalid_subscription_type',
  
  // Tenant Management
  TENANT_NOT_FOUND = 'business/tenant/not_found',
  TENANT_LIMIT_REACHED = 'business/tenant/limit_reached',
  TENANT_CREATE_FAILED = 'business/tenant/create_failed',
  TENANT_UPDATE_FAILED = 'business/tenant/update_failed',
  TENANT_DELETE_FAILED = 'business/tenant/delete_failed',
  TENANT_SUSPEND_FAILED = 'business/tenant/suspend_failed',
  TENANT_REACTIVATE_FAILED = 'business/tenant/reactivate_failed',
  TENANT_INVALID_NAME = 'business/tenant/invalid_name',
  TENANT_INVALID_DOMAIN = 'business/tenant/invalid_domain',
  TENANT_INVALID_EMAIL = 'business/tenant/invalid_email',
  TENANT_INVALID_INDUSTRY = 'business/tenant/invalid_industry',
  TENANT_INVALID_TYPE = 'business/tenant/invalid_type',
  TENANT_INVALID_STATUS = 'business/tenant/invalid_status',
  TENANT_INVALID_OWNER = 'business/tenant/invalid_owner',
  TENANT_INVALID_DETAILS = 'business/tenant/invalid_details',
  TENANT_INVALID_SETTINGS = 'business/tenant/invalid_settings',
  TENANT_INVALID_JOIN_REQUESTS = 'business/tenant/invalid_join_requests',
  TENANT_INVALID_USER_LIMITS = 'business/tenant/invalid_user_limits',
  TENANT_INVALID_SECURITY = 'business/tenant/invalid_security',

  
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
  RESOURCE_NOT_FOUND = 'business/resource/not_found',
  RESOURCE_CREATE_FAILED = 'business/resource/create_failed',
  RESOURCE_UPDATE_FAILED = 'business/resource/update_failed',
  RESOURCE_DELETE_FAILED = 'business/resource/delete_failed',

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
