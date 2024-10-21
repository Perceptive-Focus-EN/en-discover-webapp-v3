// src/constants/metrics.ts

export const METRIC_TYPES = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
} as const;

export const DEFAULT_METRICS = {
  API_CALLS: 'API_CALLS',
  ERROR_COUNT: 'ERROR_COUNT',
  REQUEST_COUNT: 'REQUEST_COUNT',
  RESPONSE_TIME: 'RESPONSE_TIME',
  ACTIVE_USERS: 'ACTIVE_USERS',
  LOG_INFO: 'LOG_INFO',
  EMOTION_MAPPING_GET: 'EMOTION_MAPPING_GET',
  EMOTION_MAPPING_CREATE: 'EMOTION_MAPPING_CREATE',
  EMOTION_MAPPING_UPDATE_ALL: 'EMOTION_MAPPING_UPDATE_ALL',
  EMOTION_MAPPING_UPDATE_SINGLE: 'EMOTION_MAPPING_UPDATE_SINGLE',
  EMOTION_MAPPING_UPDATE_FAILED: 'EMOTION_MAPPING_UPDATE_FAILED',
  EMOTION_MAPPING_DELETE: 'EMOTION_MAPPING_DELETE',
  EMOTION_MAPPING_DELETE_FAILED: 'EMOTION_MAPPING_DELETE_FAILED',
  EMOTION_MAPPING_METHOD_NOT_ALLOWED: 'EMOTION_MAPPING_METHOD_NOT_ALLOWED',
  EMOTION_MAPPING_RESPONSE_TIME: 'EMOTION_MAPPING_RESPONSE_TIME',
} as const;

export const METRIC_UNITS = {
  MILLISECONDS: 'ms',
  COUNT: 'count',
  SECONDS: 'seconds',
  BYTES: 'bytes'
} as const;

// Logging constants
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export const LOG_METRICS = {
  ERROR: 'log_error',
  WARN: 'log_warn',
  INFO: 'log_info',
  DEBUG: 'log_debug',
  API_CALLS: 'api_calls',
  REQUEST_COUNT: 'request_count',
  RESPONSE_TIME: 'response_time',
  DATABASE_ERROR: 'database_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  VALIDATION_ERROR: 'validation_error',
  PAYMENT_PROCESSING_ERROR: 'payment_processing_error',
  EMOTION_MAPPING_GET: 'emotion_mapping_get',
  EMOTION_MAPPING_CREATE: 'emotion_mapping_create',
  EMOTION_MAPPING_UPDATE_ALL: 'emotion_mapping_update_all',
  EMOTION_MAPPING_UPDATE_SINGLE: 'emotion_mapping_update_single',
  EMOTION_MAPPING_UPDATE_FAILED: 'emotion_mapping_update_failed',
  EMOTION_MAPPING_DELETE: 'emotion_mapping_delete',
  EMOTION_MAPPING_DELETE_FAILED: 'emotion_mapping_delete_failed',
  EMOTION_MAPPING_METHOD_NOT_ALLOWED: 'emotion_mapping_method_not_allowed',
  EMOTION_MAPPING_RESPONSE_TIME: 'emotion_mapping_response_time',
} as const;

// Environment variables
export const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  API_URL: 'API_URL',
  DATABASE_URL: 'DATABASE_URL',
  REDIS_URL: 'REDIS_URL',
} as const;