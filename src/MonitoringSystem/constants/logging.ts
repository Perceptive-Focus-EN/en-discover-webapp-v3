// src/MonitoringSystem/constants/logging.ts

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export enum LogCategory {
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance',
  APPLICATION = 'application'
}

export const LOG_PATTERNS = {
  SYSTEM: 'SYS_{component}_{action}_{timestamp}',
  SECURITY: 'SEC_{component}_{action}_{timestamp}',
  BUSINESS: 'BIZ_{component}_{action}_{timestamp}',
  INTEGRATION: 'INT_{component}_{action}_{timestamp}'
} as const;

export const LOG_RETENTION = {
  ERROR: 90, // days
  WARN: 30,
  INFO: 7,
  DEBUG: 1
} as const;