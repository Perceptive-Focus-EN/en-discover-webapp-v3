import { ErrorDetails, ErrorResponse } from '../types/errors';
import { HTTP_STATUS } from '../constants/errorCodes';

export class AppError extends Error {
  public readonly code: string;
  public readonly metadata?: Record<string, any>;
  public readonly statusCode: number;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.code = details.code;
    this.metadata = details.metadata;
    this.statusCode = details.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): ErrorResponse {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      statusCode: this.statusCode,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}