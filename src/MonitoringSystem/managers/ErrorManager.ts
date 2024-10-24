// src/MonitoringSystem/managers/ErrorManager.ts

import {
  ErrorType,
  ErrorCategory,
  ErrorEnums
} from '../constants/errors';
import { HttpStatus } from '../constants/httpStatus';
import { ErrorResponse } from '../types/errors';
import { loggerManager } from './LoggerManager';
import { AppError } from '../managers/AppError';
import {
  SystemMessages,
  SecurityMessages,
  BusinessMessages,
  IntegrationMessages
} from '../constants/messages';

import { ErrorPatternsList, ErrorComponent } from '../types/ErrorPatternsList';
import { ErrorReferenceGenerator } from '../utils/errorReferenceGenerator';

// Update the MessageMap type
type MessageMap = {
  [K in ErrorCategory]: {
    [key in ErrorType]?: {
      error: string;
      warn: string;
      info: string;
    };
  };
};

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

class ErrorManager {
  private messageMap: MessageMap = {
    system: SystemMessages,
    security: SecurityMessages,
    business: BusinessMessages,
    integration: IntegrationMessages
  };

  private getErrorEnum(category: ErrorCategory) {
    return ErrorEnums[category];
  }

  private generateErrorReference(errorType: string, category: ErrorCategory): string {
    const [_, component, action] = errorType.split('/');
    
    return ErrorReferenceGenerator.generate({
      category: CATEGORY_MAP[category],
      component,
      action
    });
  }

  public handleError(error: AppError): ErrorResponse {
    const [category] = error.type.split('/') as [ErrorCategory];
    
    const userMessage = this.messageMap[category]?.[error.type]?.error || 
      'An unexpected error occurred';

    const statusCode = error.statusCode || ERROR_STATUS_MAP[category];
    const errorReference = error.errorReference || 
      this.generateErrorReference(error.type, category);

    loggerManager.error(new Error(error.message), error.type, {
      errorReference,
      stack: error.stack,
      category,
      statusCode,
      metadata: error.metadata,
      timestamp: error.timestamp
    });

    return {
      userMessage,
      errorType: error.type as ErrorType,
      statusCode,
      errorReference,
      metadata: error.metadata
    };
  }

  public createError(
    category: ErrorCategory,
    errorCode: string,
    message?: string,
    metadata?: Record<string, unknown>
  ): AppError {
    const errorEnum = this.getErrorEnum(category);
    const errorType = errorEnum[errorCode as keyof typeof errorEnum];

    if (!errorType) {
      throw new Error(`Invalid error code: ${errorCode} for category: ${category}`);
    }

    const errorReference = this.generateErrorReference(errorType, category);

    return new AppError({
      type: errorType,
      message: message || this.messageMap[category]?.[errorType]?.error || 'An unexpected error occurred',
      statusCode: ERROR_STATUS_MAP[category],
      metadata,
      errorReference
    });
  }

  public enrichError(error: AppError, additionalMetadata?: Record<string, unknown>): AppError {
    return error.withMetadata(additionalMetadata || {});
  }
}

export const errorManager = new ErrorManager();

/* Usage Examples:

// Creating a system error
try {
  // Database operation
  throw errorManager.createError(
    'system',
    'DATABASE_CONNECTION_FAILED',
    'Failed to connect to database',
    { host: 'localhost', port: 5432 }
  );
} catch (error) {
  if (AppError.isAppError(error)) {
    // Will generate reference like: SYS_DATABASE_CONNECTION_abc123
    const errorResponse = errorManager.handleError(error);
    console.log(errorResponse);
  }
}

// Creating a business error
try {
  // User operation
  throw errorManager.createError(
    'business',
    'USER_NOT_FOUND',
    'User not found',
    { userId: '123' }
  );
} catch (error) {
  if (AppError.isAppError(error)) {
    // Will generate reference like: API_USER_NOTFOUND_xyz789
    const errorResponse = errorManager.handleError(error);
    console.log(errorResponse);
  }
}

// API Response Example
app.use((error: unknown, req: Request, res: Response) => {
  if (AppError.isAppError(error)) {
    const errorResponse = errorManager.handleError(error);
    return res.status(errorResponse.statusCode)
      .json({
        message: errorResponse.userMessage,
        reference: errorResponse.errorReference,
        type: errorResponse.errorType
      });
  }
  
  // Handle unknown errors
  const appError = errorManager.createError(
    'system',
    'GENERAL',
    error instanceof Error ? error.message : 'Unknown error'
  );
  
  const errorResponse = errorManager.handleError(appError);
  return res.status(errorResponse.statusCode).json(errorResponse);
});
*/