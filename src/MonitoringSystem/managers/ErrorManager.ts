// src/MonitoringSystem/managers/ErrorManager.ts
import { ErrorType, ErrorCategory, ErrorEnums } from '../constants/errors';
import { HttpStatus } from '../constants/httpStatus';
import { ErrorResponse } from '../types/errors';
import { AppError } from '../managers/AppError';
import { 
  SystemMessages, 
  SecurityMessages, 
  BusinessMessages, 
  IntegrationMessages 
} from '../constants/messages';
import { ServiceBus } from '../core/ServiceBus';
import { CircuitBreaker } from '../utils/CircuitBreaker';

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

export class ErrorManager {
  private static instance: ErrorManager;
  private readonly DEFAULT_TENANT_ID = 'system';
  
  private readonly messageMap: MessageMap = {
    system: SystemMessages,
    security: SecurityMessages,
    business: BusinessMessages,
    integration: IntegrationMessages
  };

  private constructor(
    private readonly circuitBreaker: CircuitBreaker,
    private readonly serviceBus: ServiceBus
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.serviceBus.on('circuit.error', (data) => {
      this.handleCircuitError(data);
    });

    this.serviceBus.on('system.critical', (data) => {
      this.handleSystemCritical(data);
    });
  }

  private handleCircuitError(data: any): void {
    const error = this.createError(
      'system',
      'CIRCUIT_BREAKER_TRIGGERED',
      `Circuit breaker triggered for ${data.circuit}`,
      data
    );
    this.handleError(error);
  }

  private handleSystemCritical(data: any): void {
    const error = this.createError(
      'system',
      'SYSTEM_CRITICAL',
      'System entered critical state',
      data
    );
    this.handleError(error);
  }

  public static getInstance(
    circuitBreaker: CircuitBreaker,
    serviceBus: ServiceBus
  ): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager(circuitBreaker, serviceBus);
    }
    return ErrorManager.instance;
  }

  private getErrorEnum(category: ErrorCategory): Record<string, string> {
    return ErrorEnums[category] || {};
  }

  private generateErrorReference(errorType: string, category: ErrorCategory): string {
    const [_, component, action] = errorType.split('/');
    return `${category.toUpperCase()}_${component || 'UNKNOWN'}_${action || 'ERROR'}_${Date.now().toString(36)}`;
  }

  public handleError(error: AppError): ErrorResponse {
    const [category] = error.type.split('/') as [ErrorCategory];
    const userMessage = this.messageMap[category]?.[error.type]?.error || DEFAULT_ERROR_MESSAGE;
    const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    const errorReference = error.errorReference || this.generateErrorReference(error.type, category);

    // Emit error event for logging and metrics
    this.serviceBus.emit('error.occurred', {
      type: error.type,
      message: error.message,
      metadata: {
        errorReference,
        stack: error.stack,
        category,
        statusCode,
        metadata: error.metadata,
        timestamp: error.timestamp,
        tenantId: error.tenantId,
        currentTenantId: error.currentTenantId,
        personalTenantId: error.personalTenantId
      }
    });

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
    const errorType = errorEnum[errorCode];

    if (!errorType) {
      return this.createUnknownError(category, errorCode, message, metadata, tenantId);
    }

    const errorReference = this.generateErrorReference(errorType, category);

    return new AppError({
      type: errorType as ErrorType,
      message: message || DEFAULT_ERROR_MESSAGE,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      metadata,
      errorReference,
      tenantId: tenantId || this.DEFAULT_TENANT_ID
    });
  }

  private createUnknownError(
    category: ErrorCategory,
    errorCode: string,
    message?: string,
    metadata?: Record<string, unknown>,
    tenantId?: string
  ): AppError {
    const errorReference = this.generateErrorReference(`${category}/unknown/${errorCode}`, category);
    
    return new AppError({
      type: `${category}/unknown_error` as ErrorType,
      message: message || DEFAULT_ERROR_MESSAGE,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      metadata: { ...metadata, originalErrorCode: errorCode },
      errorReference,
      tenantId: tenantId || this.DEFAULT_TENANT_ID
    });
  }

  public enrichError(error: AppError, additionalMetadata?: Record<string, unknown>): AppError {
    return error.withMetadata(additionalMetadata || {});
  }
}