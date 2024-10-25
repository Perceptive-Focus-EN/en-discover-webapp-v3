// src/MonitoringSystem/managers/ErrorManager.ts
import {
  ErrorType,
  ErrorCategory,
  ErrorEnums
} from '../constants/errors';
import { HttpStatus } from '../constants/httpStatus';
import { ErrorResponse } from '../types/errors';
import { AppError } from '../managers/AppError';
import {
  SystemMessages,
  SecurityMessages,
  BusinessMessages,
  IntegrationMessages
} from '../constants/messages';
import { ErrorPatternsList, ErrorComponent } from '../types/ErrorPatternsList';
import { ErrorReferenceGenerator } from '../utils/errorReferenceGenerator';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { LoggerManager } from './LoggerManager';

type MessageMap = {
  [K in ErrorCategory]: {
    [key in ErrorType]?: {
      error: string;
      warn: string;
      info: string;
    };
  };
};

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred';
const BACKUP_ERROR_TYPE = 'system/general_error';
const BACKUP_CATEGORY = 'system';


const ERROR_STATUS_MAP: Record<ErrorCategory, HttpStatus> = {
  system: HttpStatus.INTERNAL_SERVER_ERROR,
  security: HttpStatus.UNAUTHORIZED,
  business: HttpStatus.BAD_REQUEST,
  integration: HttpStatus.SERVICE_UNAVAILABLE
};

const CATEGORY_MAP: Record<ErrorCategory, ErrorComponent['category']> = {
  system: 'SYS',
  business: 'API',
  security: 'SEC',
  integration: 'INT'
};

export class ErrorManager {
  private readonly DEFAULT_TENANT_ID = 'system';

  private static instance: ErrorManager;
  private messageMap: MessageMap = {
    system: SystemMessages,
    security: SecurityMessages,
    business: BusinessMessages,
    integration: IntegrationMessages
  };
  private logger: LoggerManager | null = null;

  private constructor(private circuitBreaker: CircuitBreaker) {}

  public static getInstance(circuitBreaker: CircuitBreaker): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager(circuitBreaker);
    }
    return ErrorManager.instance;
  }

  public setLogger(logger: LoggerManager): void {
    this.logger = logger;
  }

  private getErrorEnum(category: ErrorCategory) {
    return ErrorEnums[category] || {};
  }

  private generateErrorReference(errorType: string, category: ErrorCategory): string {
    const [_, component, action] = errorType.split('/');
    
    return ErrorReferenceGenerator.generate({
      category: CATEGORY_MAP[category] || CATEGORY_MAP[BACKUP_CATEGORY],
      component: component || 'general',
      action: action || 'error'
    });
  }

  private handleUnknownError(
    category: ErrorCategory,
    errorCode: string,
    message?: string,
    metadata?: Record<string, unknown>,
    tenantId?: string

  ): AppError {
    const errorType = BACKUP_ERROR_TYPE;

    if (this.logger) {
      this.logger.warn(`Unknown error code: ${errorCode} for category: ${category}. Using fallback.`);
    }

    const errorReference = this.generateErrorReference(errorType, BACKUP_CATEGORY);

    return new AppError({
      type: errorType as ErrorType,
      message: message || DEFAULT_ERROR_MESSAGE,
      statusCode: ERROR_STATUS_MAP[BACKUP_CATEGORY],
      metadata,
      errorReference,
      tenantId: tenantId || this.DEFAULT_TENANT_ID
    });
  }

  public handleError(error: AppError): ErrorResponse {
  const [category] = error.type.split('/') as [ErrorCategory];
  const userMessage = this.messageMap[category]?.[error.type]?.error || DEFAULT_ERROR_MESSAGE;

  const statusCode = error.statusCode || ERROR_STATUS_MAP[category] || HttpStatus.INTERNAL_SERVER_ERROR;
  const errorReference = error.errorReference || this.generateErrorReference(error.type, category);

  if (this.logger) {
    this.logger.error(new Error(error.message), error.type, {
      errorReference,
      stack: error.stack,
      category,
      statusCode,
      metadata: error.metadata,
      timestamp: error.timestamp,
      tenantId: error.tenantId,
      currentTenantId: error.currentTenantId,
      personalTenantId: error.personalTenantId
    });
  }

  return {
    userMessage,
    errorType: error.type as ErrorType,
    statusCode,
    errorReference,
    metadata: error.metadata,
    tenantId: error.tenantId,
    currentTenantId: error.currentTenantId,
    personalTenantId: error.personalTenantId
  };
  }
  
   public createError(
    category: ErrorCategory,
    errorCode: string,
    message?: string,
    metadata?: Record<string, unknown>,
    tenantId?: string
  ): AppError {
    const errorEnum = this.getErrorEnum(category);
    const errorType = errorEnum[errorCode as keyof typeof errorEnum];

    if (!errorType) {
      return this.handleUnknownError(category, errorCode, message, metadata, tenantId);
    }

    const errorReference = this.generateErrorReference(errorType, category);

    return new AppError({
      type: errorType as ErrorType,
      message: message || this.messageMap[category]?.[errorType]?.error || DEFAULT_ERROR_MESSAGE,
      statusCode: ERROR_STATUS_MAP[category],
      metadata,
      errorReference,
      tenantId: tenantId || this.DEFAULT_TENANT_ID
    });
    }

  public enrichError(error: AppError, additionalMetadata?: Record<string, unknown>): AppError {
    return error.withMetadata(additionalMetadata || {});
  }
}