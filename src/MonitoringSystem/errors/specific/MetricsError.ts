// src/MonitoringSystem/errors/specific/MetricsError.ts
import { SystemError, SecurityError, BusinessError, IntegrationError } from '../../constants/errors'
import { AppError } from '../../managers/AppError';
import { HttpStatus } from '../../constants/httpStatus';

export class MetricsError extends AppError {
  constructor(
    message: string,
    metadata?: Record<string, any>
  ) {
    super({
      type: SystemError.METRICS_PROCESSING_FAILED,
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      metadata,
      errorReference: 'METRICS_ERROR',
      tenantId: 'defaultTenant'
    });
  }
}
