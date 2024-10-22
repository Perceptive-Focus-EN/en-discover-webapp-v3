// src/constants/logging.ts

import { SystemContext } from "@/types/logging";


export enum LOG_LEVELS {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export type LogLevel = keyof typeof LOG_LEVELS;

// src/constants/logging.ts
export enum LOG_METRICS {
  // General metrics
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_LIMIT_ERROR = 'RESOURCE_LIMIT_ERROR',
  ONBOARDING_ERROR = 'ONBOARDING_ERROR',
  UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR',
  SIGNUP_ERROR = 'SIGNUP_ERROR',
  API_ERROR = 'API_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  SUBSCRIPTION_ERROR = 'SUBSCRIPTION_ERROR',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
  SESSION_ERROR = 'SESSION_ERROR',
  TENANT_ERROR = 'TENANT_ERROR',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  FEATURE_FLAG_ERROR = 'FEATURE_FLAG_ERROR',
  LOGGING_ERROR = 'LOGGING_ERROR',
  METRICS_ERROR = 'METRICS_ERROR',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',

  // Settings metrics
  SETTINGS_FETCH_DURATION = 'SETTINGS_FETCH_DURATION',
  SETTINGS_UPDATE_DURATION = 'SETTINGS_UPDATE_DURATION',

  // Redis-specific metrics
  REDIS_HIT = 'redis_hit',
  REDIS_MISS = 'redis_miss',
  REDIS_GET_ERROR = 'redis_get_error',
  REDIS_SET_ERROR = 'redis_set_error',
  REDIS_DELETE_ERROR = 'redis_delete_error',
  REDIS_STORE_USER_TOKEN_ERROR = 'redis_store_user_token_error',
  REDIS_REMOVE_USER_TOKEN_ERROR = 'redis_remove_user_token_error',
  REDIS_GET_USER_TOKEN_ERROR = 'redis_get_user_token_error',
  REDIS_TTL_ERROR = 'redis_ttl_error',
  REDIS_STORE_REFRESH_TOKEN_ERROR = 'redis_store_refresh_token_error',
  REDIS_GET_REFRESH_TOKEN_ERROR = 'redis_get_refresh_token_error',
  REDIS_REMOVE_REFRESH_TOKEN_ERROR = 'redis_remove_refresh_token_error',
  REDIS_STORE_SESSION_ERROR = 'redis_store_session_error',
  REDIS_GET_SESSION_ERROR = 'redis_get_session_error',

  // Emotion mapping metrics
  EMOTION_MAPPING_GET = 'emotion_mapping_get',
  EMOTION_MAPPING_CREATE = 'emotion_mapping_create',
  EMOTION_MAPPING_UPDATE_ALL = 'emotion_mapping_update_all',
  EMOTION_MAPPING_UPDATE_SINGLE = 'emotion_mapping_update_single',
  EMOTION_MAPPING_UPDATE_FAILED = 'emotion_mapping_update_failed',
  EMOTION_MAPPING_DELETE = 'emotion_mapping_delete',
  EMOTION_MAPPING_DELETE_FAILED = 'emotion_mapping_delete_failed',
  EMOTION_MAPPING_METHOD_NOT_ALLOWED = 'emotion_mapping_method_not_allowed',
  EMOTION_MAPPING_RESPONSE_TIME = 'emotion_mapping_response_time',

  // Post creation metrics
  POST_CREATION_ATTEMPTS = 'post_creation_attempts',
  POST_CREATION_SUCCESS = 'post_creation_success',
  POST_CREATION_FAILURES = 'post_creation_failures',
  POST_CREATION_DURATION = "POST_CREATION_DURATION",
  FETCH_POSTS_DURATION = "FETCH_POSTS_DURATION",
}

export type LogMetrics = keyof typeof LOG_METRICS;


export const API_ENDPOINTS = {
  LOG: '/api/logs',
  METRICS: '/api/metrics',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  INVALID_LOG_FORMAT: 406,
};


export const SYSTEM_CONTEXT_INSTANCE: SystemContext = {
  systemId: 'main-app',
  systemName: 'en-discover-app',
  environment: process.env.NODE_ENV as 'development' | 'staging' | 'production'
};
