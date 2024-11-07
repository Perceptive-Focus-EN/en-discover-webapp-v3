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

export interface CircuitErrorData {
    circuit: string;
    [key: string]: unknown;
}

export interface SystemCriticalData {
    message: string;
    timestamp: string;
    [key: string]: unknown;
}

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

  private handleCircuitError(data: unknown): void {
    const circuitData = data as CircuitErrorData;
    const error = this.createError(
        'system',
        'CIRCUIT_BREAKER_TRIGGERED',
        `Circuit breaker triggered for ${circuitData?.circuit || 'unknown circuit'}`,
        { circuitData }
    );
    this.handleError(error);
  }

  private handleSystemCritical(data: unknown): void {
    const criticalData = data as SystemCriticalData;
    const error = this.createError(
        'system',
        'SYSTEM_CRITICAL',
        'System entered critical state',
        { 
            criticalData,
            timestamp: new Date().toISOString()
        }
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
        try {
            if (!errorType || typeof errorType !== 'string') {
                return `${category.toUpperCase()}_INVALID_TYPE_${Date.now().toString(36)}`;
            }
            const [_, component = 'unknown', action = 'error'] = errorType.split('/');
            return `${category.toUpperCase()}_${component}_${action}_${Date.now().toString(36)}`;
        } catch (error) {
            return `${category.toUpperCase()}_UNKNOWN_ERROR_${Date.now().toString(36)}`;
        }
    }

    public handleError(error: unknown): ErrorResponse {
        try {
            // Handle null/undefined errors
            if (!error) {
                return this.handleError(
                    this.createUnknownError(
                        'system',
                        'NULL_ERROR',
                        'Null or undefined error received'
                    )
                );
            }

            // Convert unknown errors to AppError
            if (!(error instanceof AppError)) {
                return this.handleError(
                    this.createUnknownError(
                        'system',
                        'UNKNOWN_ERROR',
                        error instanceof Error ? error.message : 'Unknown error occurred',
                        { 
                            originalError: error,
                            errorType: error instanceof Error ? error.name : typeof error
                        }
                    )
                );
            }

            // Safe handling of error type splitting
            const [category = 'system'] = error.type?.split('/') as [ErrorCategory];
            const userMessage = this.messageMap[category]?.[error.type]?.error || DEFAULT_ERROR_MESSAGE;
            const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
            const errorReference = error.errorReference || this.generateErrorReference(error.type, category as ErrorCategory);

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

        } catch (handlingError) {
            const fallbackReference = `SYSTEM_ERROR_HANDLING_FAILED_${Date.now().toString(36)}`;
            
            this.serviceBus.emit('error.occurred', {
                type: 'system/error_handling_failed',
                message: 'Error occurred during error handling',
                metadata: {
                    originalError: error,
                    handlingError,
                    errorReference: fallbackReference,
                    timestamp: new Date().toISOString(),
                    stack: handlingError instanceof Error ? handlingError.stack : undefined
                }
            });

            return {
                userMessage: DEFAULT_ERROR_MESSAGE,
                errorType: 'system/error_handling_failed' as ErrorType,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                errorReference: fallbackReference,
                metadata: { 
                    originalError: error,
                    handlingError: handlingError instanceof Error ? handlingError.message : 'Unknown handling error'
                },
                tenantId: this.DEFAULT_TENANT_ID
            };
        }
    }

    public createError(
        category: ErrorCategory,
        errorCode: string,
        message?: string,
        metadata?: Record<string, unknown>,
        tenantId?: string
    ): AppError {
        try {
            // Validate inputs
            if (!category || !errorCode) {
                return this.createUnknownError(
                    'system',
                    'INVALID_ERROR_PARAMS',
                    'Missing required error parameters',
                    { category, errorCode }
                );
            }

            const errorEnum = this.getErrorEnum(category);
            const errorType = errorEnum[errorCode];

            if (!errorType) {
                return this.createUnknownError(
                    category, 
                    errorCode,
                    message,
                    { ...metadata, invalidErrorCode: true },
                    tenantId
                );
            }

            const errorReference = this.generateErrorReference(errorType, category);

            return new AppError({
                type: errorType as ErrorType,
                message: message || DEFAULT_ERROR_MESSAGE,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                metadata: metadata ? { ...metadata, category, errorCode } : { category, errorCode },
                errorReference,
                tenantId: tenantId || this.DEFAULT_TENANT_ID
            });
        } catch (error) {
            return this.createUnknownError(
                'system',
                'ERROR_CREATION_FAILED',
                'Failed to create error',
                {
                    originalError: error,
                    attemptedCategory: category,
                    attemptedCode: errorCode,
                    timestamp: new Date().toISOString()
                }
            );
        }
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
        if (!(error instanceof AppError)) {
            return this.createUnknownError(
                'system',
                'INVALID_ERROR_ENRICHMENT',
                'Attempted to enrich non-AppError',
                { originalError: error, additionalMetadata }
            );
        }
        return error.withMetadata(additionalMetadata || {});
    }

    public isMonitoringError(error: unknown): error is AppError {
        return error instanceof AppError;
    }
  
  public async attemptErrorRecovery(error: AppError): Promise<boolean> {
    try {
        if (error.type.includes('circuit_breaker')) {
            const circuit = error.metadata?.circuit as string;
            if (circuit) {
                // Use existing CircuitBreaker methods
                if (this.circuitBreaker.isOpen(circuit)) {
                    this.circuitBreaker.recordSuccess(circuit); // This will reset the circuit if open
                }
                return true;
            }
        }
        return false;
    } catch (recoveryError) {
        this.serviceBus.emit('error.recovery.failed', {
            originalError: error,
            recoveryError,
            timestamp: new Date().toISOString()
        });
        return false;
    }
  }
}