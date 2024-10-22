import { AppError } from '../AppError';
import { ERROR_CODES, HTTP_STATUS } from '../../constants/errorCodes';

export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super({
      code: ERROR_CODES.DATABASE.CONNECTION,
      message,
      metadata,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super({
      code: ERROR_CODES.AUTH.UNAUTHORIZED,
      message,
      metadata,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super({
      code: ERROR_CODES.VALIDATION.INVALID_INPUT,
      message,
      metadata,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, metadata?: Record<string, any>) {
    super({
      code: ERROR_CODES.API.REQUEST_FAILED,
      message,
      metadata,
      statusCode,
    });
  }
}

export class PaymentError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super({
      code: ERROR_CODES.PAYMENT.PROCESSING_FAILED,
      message,
      metadata,
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
}


// Add more specific error classes as needed...