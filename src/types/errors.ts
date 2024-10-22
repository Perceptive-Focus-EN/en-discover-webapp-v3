export interface ErrorDetails {
  code: string;
  message: string;
  metadata?: Record<string, any>;
  statusCode?: number;
}

export interface ErrorResponse {
  name: string;
  code: string;
  message: string;
  metadata?: Record<string, any>;
  statusCode?: number;
  stack?: string;
}

export type ErrorCategory = 'PERFORMANCE' | 'DATABASE' | 'AUTH' | 'VALIDATION' | 'API' | 'PAYMENT' | 'SUBSCRIPTION' | 'NOTIFICATION' | 'SESSION' | 'TENANT' | 'WEBHOOK' | 'FEATURE_FLAG' | 'LOGGING' | 'METRICS' | 'REDIS' | 'SERVER';