import { HttpStatus } from "../constants/httpStatus";
import { ErrorType } from "../constants/errors";
import { LogLevel, LogCategory } from "../constants/logging";
import { createLogEntry, LogEntry, SystemContext } from "./logging";


export type ErrorCategory = 
  | 'system'    // Infrastructure/Platform
  | 'security'  // A3uth/Access Control
  | 'business'  // Business Logic
  | 'integration'; // External Services


  // 1. Top Level Categories (src/MonitoringSystem/constants/categories.ts)
export enum ErrorCategoryEnum {
  SYSTEM = 'system',
  SECURITY = 'security',
  BUSINESS = 'business',
  INTEGRATION = 'integration'
}


// 2. Sub-categories mapped to main categories
// DO NOT USE THIS IMPLEMENTATION this is purely for helping comprehend the concept of how breadcrumbs are created and why they are structrured this way
// BREADCRUMB STRUCTURE EXAMPLE: 'business/user/not_found' → 'business' → 'user' → 'not_found' 

// export const ErrorSubCategories = {
  // system: [
    // 'database',
    // 'redis',
    // 'performance',
    // 'logging',
    // 'metrics'
  // ],
  // security: [
    // 'auth',
    // 'session',
    // 'validation'
  // ],
  // business: [
    // 'user',
    // 'tenant',
    // 'subscription',
    // 'payment',
    // 'resource'
  // ],
  // integration: [
    // 'api',
    // 'webhook',
    // 'notification',
    // 'ai'
  // ]
// } as const;
// 
// Error Related Types

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  statusCode?: HttpStatus;
  metadata?: Record<string, unknown>;
  errorReference?: string; 
}

export interface ErrorResponse {
  userMessage: string;
  errorType: ErrorType;
  statusCode: HttpStatus;
  errorReference: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorMessages {
  [key: string]: string;
}

export const isErrorType = (type: unknown): type is ErrorType => {
  return typeof type === 'string' && Object.values(ErrorType).includes(type as ErrorType);
};

export const createErrorLogEntry = (
  baseContext: SystemContext,
  error: Error,
  errorType: ErrorType,
  metadata: Record<string, unknown> = {}
): LogEntry => {
  return createLogEntry(baseContext, {
    level: LogLevel.ERROR,
    category: LogCategory.SYSTEM,
    message: error.message,
    metadata: {
      ...metadata,
      errorType,
      originalError: error
    }
  });
}
