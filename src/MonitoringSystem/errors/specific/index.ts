// src/MonitoringSystem/errors/CustomErrors.ts
import { SystemError, SecurityError, BusinessError, IntegrationError } from '../../constants/errors';
import { HttpStatus } from '../../constants/httpStatus';
import { AppError } from '../../managers/AppError';

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      type: SystemError.DATABASE_CONNECTION_FAILED,
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      metadata
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      type: SecurityError.AUTH_FAILED,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      metadata
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      type: BusinessError.VALIDATION_FAILED,
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      metadata
    });
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR, metadata?: Record<string, unknown>) {
    super({
      type: IntegrationError.API_REQUEST_FAILED,
      message,
      statusCode,
      metadata
    });
  }
}

export class PaymentError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      type: BusinessError.PAYMENT_PROCESSING_FAILED,
      message,
      statusCode: HttpStatus.BAD_REQUEST,
      metadata
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super({
      type: SecurityError.AUTH_UNAUTHORIZED,
      message,
      statusCode: HttpStatus.UNAUTHORIZED,
      metadata
    });
  }
}

// ... continue with other errors using appropriate error types from enums ...

/* Usage Example:
try {
  throw new DatabaseError('Database connection failed', {
    host: 'localhost',
    port: 5432
  });
} catch (error) {
  if (AppError.isAppError(error)) {
    // Will generate reference like: SYS_DATABASE_CONNECTION_abc123
    errorManager.handleError(error);
  }
}
*/