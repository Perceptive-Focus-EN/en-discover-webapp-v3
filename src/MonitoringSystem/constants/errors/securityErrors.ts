// src/MonitoringSystem/constants/errors/securityErrors.ts
export enum SecurityError {


  API_REQUEST_FAILED = 'system/api/request_failed',
AUTH_TOKEN_FAILED = 'security/auth/token_failed',
AUTH_LOGOUT_FAILED = 'security/auth/logout_failed',
  AUTH_REFRESH_FAILED = 'security/auth/refresh_failed',
  AUTH_FAILED = 'security/auth/failed',
  AUTH_TOKEN_EXPIRED = 'security/auth/expired',
  AUTH_TOKEN_INVALID = 'security/auth/invalid_token',

  // Authentication
  AUTH_INVALID_CREDENTIALS = 'security/auth/invalid_credentials',
  AUTH_UNAUTHORIZED = 'security/auth/unauthorized',
  AUTH_FORBIDDEN = 'security/auth/forbidden',
  AUTH_SESSION_EXPIRED = 'security/auth/session_expired',
  AUTH_SESSION_INVALID = 'security/auth/session_invalid',

  // Session
  SESSION_INVALID = 'security/session/invalid',
  SESSION_EXPIRED = 'security/session/expired',
  SESSION_CREATE_FAILED = 'security/session/create_failed',

  // Tenant
  TENANT_NOT_FOUND = 'security/tenant/not_found',
  TENANT_CREATE_FAILED = 'security/tenant/create_failed',
  TENANT_UPDATE_FAILED = 'security/tenant/update_failed',

  // Validation
  VALIDATION_INVALID_INPUT = 'security/validation/invalid_input',
  VALIDATION_MISSING_FIELD = 'security/validation/missing_field',
  VALIDATION_INVALID_FORMAT = 'security/validation/invalid_format',
  REQUEST_INTERCEPTOR_ERROR = "REQUEST_INTERCEPTOR_ERROR",
  TOKEN_OPERATION_FAILED = "TOKEN_OPERATION_FAILED"
}