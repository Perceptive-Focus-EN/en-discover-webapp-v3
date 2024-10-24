// src/MonitoringSystem/types/logging.ts

import { LogLevel, LogCategory } from '../constants/logging';
import { ErrorType } from '../constants/errors';

// Environment and System Types
export type Environment = 'development' | 'staging' | 'production';

export interface SystemContext {
  systemId: string;
  systemName: string;
  environment: Environment;
  version?: string;
  region?: string;
  metadata?: Record<string, unknown>;
}

// Request Context Types
export interface RequestContext {
  id: string;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  headers?: Record<string, string>;
}

// Log Related Types
export interface LogEntry extends SystemContext {
  // Identity context
  tenantId?: string;
  userId: string;
  sessionId?: string;
  correlationId?: string;

  // Log details
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: Date;

  // Additional context
  metadata: Record<string, unknown>;
  request?: RequestContext;
  
  // Optional fields
  tags?: string[];
  source?: string;
  duration?: number;
}

export interface LogOptions {
  correlationId?: string;
  tags?: string[];
  category?: LogCategory;
  source?: string;
  maskSensitiveData?: boolean;
}

export interface LoggerConfig {
  systemContext: SystemContext;
  minLevel: LogLevel;
  maskFields?: string[];
  includeTimestamp?: boolean;
  formatOutput?: (entry: LogEntry) => string;
  bufferSize?: number;
  flushInterval?: number;
}

// Type Guards
export const isLogLevel = (level: unknown): level is LogLevel => {
  return typeof level === 'string' && Object.values(LogLevel).includes(level as LogLevel);
};

// Function Types
export type LogFunction = (
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
  options?: LogOptions
) => void;

// Logger Interface
export interface ILogger {
  log: LogFunction;
  error(error: Error, errorType: ErrorType, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
  child(metadata: Record<string, unknown>): ILogger;
}

// Aggregation Types
export interface LogAggregation {
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  metadata: Record<string, unknown>;
}

export interface LogBatch {
  logs: LogEntry[];
  timestamp: Date;
  context: SystemContext;
}

// Helper Functions
export const createLogEntry = (
  baseContext: SystemContext,
  params: Partial<Omit<LogEntry, keyof SystemContext>> & {
    metadata?: Record<string, unknown>
  }
): LogEntry => {
  return {
    ...baseContext,
    userId: params.userId || 'system',
    level: params.level || LogLevel.INFO,
    category: params.category || LogCategory.SYSTEM,
    message: params.message || '',
    timestamp: params.timestamp || new Date(),
    metadata: params.metadata || {},
    ...params
  };
};

// Pattern Types
export interface LogPattern {
  category: LogCategory;
  component: string;
  action: string;
  timestamp?: string;
}

export interface LogReference {
  pattern: string;
  params: LogPattern;
}

// Persistence Types
export interface PersistenceOptions {
  batchSize?: number;
  flushInterval?: number;
  retentionDays?: number;
  storagePrefix?: string;
}

// Queue Types
export interface LogQueue {
  add(entry: LogEntry): void;
  flush(): Promise<void>;
  size(): number;
}
