import { ErrorCategory } from '../types/errors';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INVALID_LOG_FORMAT: 406,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const createErrorCode = (category: ErrorCategory, code: string) => `${category}_${code}`;


export const ERROR_CODES = {
  DATABASE: {
    CONNECTION: createErrorCode('DATABASE', '001'),
    QUERY: createErrorCode('DATABASE', '002'),
    MIGRATION: createErrorCode('DATABASE', '003'),
    INDEX: createErrorCode('DATABASE', '004'),
  },
  AUTH: {
    UNAUTHORIZED: createErrorCode('AUTH', '001'),
    INVALID_TOKEN: createErrorCode('AUTH', '002'),
    INVALID_CREDENTIALS: createErrorCode('AUTH', '003'),
    SESSION_EXPIRED: createErrorCode('AUTH', '004'),
  },
  VALIDATION: {
    INVALID_INPUT: createErrorCode('VALIDATION', '001'),
    MISSING_FIELD: createErrorCode('VALIDATION', '002'),
    INVALID_FORMAT: createErrorCode('VALIDATION', '003'),
  },
  API: {
    REQUEST_FAILED: createErrorCode('API', '001'),
    RESPONSE_ERROR: createErrorCode('API', '002'),
    RATE_LIMIT: createErrorCode('API', '003'),
  },
  PAYMENT: {
    PROCESSING_FAILED: createErrorCode('PAYMENT', '001'),
    INVALID_CARD: createErrorCode('PAYMENT', '002'),
    INSUFFICIENT_FUNDS: createErrorCode('PAYMENT', '003'),
  },
  SUBSCRIPTION: {
    CREATION_FAILED: createErrorCode('SUBSCRIPTION', '001'),
    UPDATE_FAILED: createErrorCode('SUBSCRIPTION', '002'),
    CANCELLATION_FAILED: createErrorCode('SUBSCRIPTION', '003'),
  },
  NOTIFICATION: {
    SEND_FAILED: createErrorCode('NOTIFICATION', '001'),
    INVALID_TEMPLATE: createErrorCode('NOTIFICATION', '002'),
    DELIVERY_FAILED: createErrorCode('NOTIFICATION', '003'),
  },
  SESSION: {
    INVALID: createErrorCode('SESSION', '001'),
    EXPIRED: createErrorCode('SESSION', '002'),
    CREATE_FAILED: createErrorCode('SESSION', '003'),
  },
  TENANT: {
    NOT_FOUND: createErrorCode('TENANT', '001'),
    CREATE_FAILED: createErrorCode('TENANT', '002'),
    UPDATE_FAILED: createErrorCode('TENANT', '003'),
  },
  WEBHOOK: {
    INVALID_SIGNATURE: createErrorCode('WEBHOOK', '001'),
    PROCESSING_FAILED: createErrorCode('WEBHOOK', '002'),
    DELIVERY_FAILED: createErrorCode('WEBHOOK', '003'),
  },
  FEATURE_FLAG: {
    NOT_FOUND: createErrorCode('FEATURE_FLAG', '001'),
    INVALID_CONFIG: createErrorCode('FEATURE_FLAG', '002'),
  },
  LOGGING: {
    WRITE_FAILED: createErrorCode('LOGGING', '001'),
    INVALID_FORMAT: createErrorCode('LOGGING', '002'),
  },
  METRICS: {
    COLLECTION_FAILED: createErrorCode('METRICS', '001'),
    INVALID_FORMAT: createErrorCode('METRICS', '002'),
  },
  REDIS: {
    CONNECTION_FAILED: createErrorCode('REDIS', '001'),
    OPERATION_FAILED: createErrorCode('REDIS', '002'),
    INVALID_DATA: createErrorCode('REDIS', '003'),
    },
    SERVER: {
        UNHEALTHY: createErrorCode('SERVER', '001'),
        UNAVAILABLE: createErrorCode('SERVER', '002'),
        TIMEOUT: createErrorCode('SERVER', '003'),
        OVERLOAD: createErrorCode('SERVER', '004'),
        TOO_MANY_REQUESTS: createErrorCode('SERVER', '005'),
        INTERNAL_ERROR: createErrorCode('SERVER', '006'),
        NOT_IMPLEMENTED: createErrorCode('SERVER', '007'),
        BAD_GATEWAY: createErrorCode('SERVER', '008'),
        GATEWAY_TIMEOUT: createErrorCode('SERVER', '009'),
        SERVICE_UNAVAILABLE: createErrorCode('SERVER', '010'),
        NOT_FOUND: createErrorCode('SERVER', '012'),
        FORBIDDEN: createErrorCode('SERVER', '013'),
        UNAUTHORIZED: createErrorCode('SERVER', '014'),
        BAD_REQUEST: createErrorCode('SERVER', '015'),
        CREATED: createErrorCode('SERVER', '016'),
        OK: createErrorCode('SERVER', '017'),
        ACCEPTED: createErrorCode('SERVER', '018'),
        NO_CONTENT: createErrorCode('SERVER', '019'),
        RESET_CONTENT: createErrorCode('SERVER', '020'),
        PARTIAL_CONTENT: createErrorCode('SERVER', '021'),
    },
    PERFORMANCE: {
        HIGH_LATENCY: createErrorCode('PERFORMANCE', '001'),
        HIGH_CPU: createErrorCode('PERFORMANCE', '002'),
        HIGH_MEMORY: createErrorCode('PERFORMANCE', '003'),
        HIGH_DISK: createErrorCode('PERFORMANCE', '004'),
        HIGH_NETWORK: createErrorCode('PERFORMANCE', '005'),
        HIGH_LOAD: createErrorCode('PERFORMANCE', '006'),
        HIGH_CONCURRENCY: createErrorCode('PERFORMANCE', '007'),
        HIGH_TRAFFIC: createErrorCode('PERFORMANCE', '008'),
        HIGH_ERROR_RATE: createErrorCode('PERFORMANCE', '009'),
    },
} as const;