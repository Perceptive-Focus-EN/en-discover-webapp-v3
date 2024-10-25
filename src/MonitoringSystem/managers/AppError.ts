// src/MonitoringSystem/errors/AppError.ts

import { ErrorType } from '../constants/errors';
import { HttpStatus } from '../constants/httpStatus';
import { ErrorDetails } from '../types/errors';
import { ErrorReferenceGenerator } from '../utils/errorReferenceGenerator';
import { ErrorComponent } from '../types/ErrorPatternsList';

const CATEGORY_MAP: Record<string, ErrorComponent['category']> = {
  'system': 'SYS',
  'business': 'API',
  'security': 'SEC',
  'integration': 'INT'
};

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: HttpStatus;
  public readonly metadata?: Record<string, unknown>;
  public readonly errorReference: string;
  public readonly timestamp: Date;
  public readonly tenantId: string;
  public readonly currentTenantId?: string;
  public readonly personalTenantId?: string;

  constructor(details: ErrorDetails) {
    super(details.message);
    
    this.type = details.type;
    this.statusCode = details.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    this.metadata = details.metadata;
    this.errorReference = details.errorReference || this.generateErrorReference();
    this.timestamp = new Date();
    this.tenantId = details.tenantId;
    this.currentTenantId = details.currentTenantId;
    this.personalTenantId = details.personalTenantId;
    this.name = this.constructor.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  private generateErrorReference(): string {
    const [category, component, action] = this.type.split('/');
    
    return ErrorReferenceGenerator.generate({
      category: CATEGORY_MAP[category] || 'SYS',
      component,
      action
    });
  }

  public toJSON(): Record<string, unknown> {
  return {
    name: this.name,
    message: this.message,
    type: this.type,
    errorReference: this.errorReference,
    statusCode: this.statusCode,
    timestamp: this.timestamp,
    metadata: this.metadata,
    tenantId: this.tenantId,
    currentTenantId: this.currentTenantId,
    personalTenantId: this.personalTenantId,
    stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
  };
  }

  public static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

    // Update withMetadata to preserve tenant info
  public withMetadata(metadata: Record<string, unknown>): AppError {
    return new AppError({
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      metadata: { ...this.metadata, ...metadata },
      errorReference: this.errorReference,
      tenantId: this.tenantId,
      currentTenantId: this.currentTenantId,
      personalTenantId: this.personalTenantId
    });
  }

  public withMessage(message: string): AppError {
    return new AppError({
      type: this.type,
      message,
      statusCode: this.statusCode,
      metadata: this.metadata,
      errorReference: this.errorReference,
      tenantId: this.tenantId,
      currentTenantId: this.currentTenantId,
      personalTenantId: this.personalTenantId
    });
  }

  public withStatusCode(statusCode: HttpStatus): AppError {
    return new AppError({
      type: this.type,
      message: this.message,
      statusCode,
      metadata: this.metadata,
      errorReference: this.errorReference,
      tenantId: this.tenantId,
      currentTenantId: this.currentTenantId,
      personalTenantId: this.personalTenantId
    });
  }

  public withErrorReference(errorReference: string): AppError {
    return new AppError({
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
      errorReference,
      tenantId: this.tenantId,
      currentTenantId: this.currentTenantId,
      personalTenantId: this.personalTenantId
    });
  }
}

/* Usage Examples:

// System Error
const dbError = new AppError({
  type: 'system/database/connection',
  message: 'Database connection failed',
  statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  metadata: { host: 'localhost' }
});
// Generates: SYS_DATABASE_CONNECTION_abc123

// Business Error
const userError = new AppError({
  type: 'business/user/not_found',
  message: 'User not found',
  statusCode: HttpStatus.NOT_FOUND,
  metadata: { userId: '123' }
});
// Generates: API_USER_NOTFOUND_xyz789

// Security Error
const authError = new AppError({
  type: 'security/auth/invalid_token',
  message: 'Invalid authentication token',
  statusCode: HttpStatus.UNAUTHORIZED
});
// Generates: SEC_AUTH_INVALID_def456

// Integration Error
const apiError = new AppError({
  type: 'integration/stripe/charge_failed',
  message: 'Payment processing failed',
  statusCode: HttpStatus.BAD_GATEWAY,
  metadata: { paymentId: 'pay_123' }
});
// Generates: INT_STRIPE_CHARGE_ghi789

// Error with custom reference
const customError = new AppError({
  type: 'business/user/not_found',
  message: 'User not found',
  errorReference: 'CUSTOM_REF_123',
  statusCode: HttpStatus.NOT_FOUND
});

// Adding metadata
const enrichedError = dbError.withMetadata({
  correlationId: 'corr_123',
  requestId: 'req_456'
});

// Modifying status code
const updatedError = authError.withStatusCode(HttpStatus.FORBIDDEN);

// API Response handling
app.use((error: unknown, req: Request, res: Response) => {
  if (AppError.isAppError(error)) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        reference: error.errorReference,
        type: error.type,
        timestamp: error.timestamp
      }
    });
    
    logger.error('Error occurred', {
      errorRef: error.errorReference,
      type: error.type,
      statusCode: error.statusCode,
      ...error.metadata
    });
  }
});
*/