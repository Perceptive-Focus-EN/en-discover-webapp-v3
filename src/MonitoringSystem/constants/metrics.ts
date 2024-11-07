// src/MonitoringSystem/constants/metrics.ts

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}

export enum MetricUnit {
  MILLISECONDS = 'ms',
  COUNT = 'count',
  SECONDS = 'seconds',
  BYTES = 'bytes',
  PERCENTAGE = 'percentage',
  PERCENT = "PERCENT"
}

export enum MetricCategory {
  SYSTEM = 'system',
  BUSINESS = 'business',
  PERFORMANCE = 'performance',
  RESOURCE = 'resource',
  SECURITY = 'security',
  MESSAGING = "MESSAGING",
  API = "API",
}

// Define metric patterns similar to error patterns
export const MetricPatternsList = [
  // System Metrics
  'SYS_{component}_{action}_{timestamp}',
  // Business Metrics
  'BIZ_{operation}_{result}_{timestamp}',
  // Performance Metrics
  'PERF_{resource}_{measurement}_{timestamp}',
  // Resource Metrics
  'RES_{type}_{usage}_{timestamp}'
] as const;