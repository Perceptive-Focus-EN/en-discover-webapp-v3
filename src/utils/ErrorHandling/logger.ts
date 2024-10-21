// src/utils/ErrorHandling/logger.ts
import { ERROR_MESSAGES } from '../../constants/errorMessages';
import { LOG_LEVELS, LOG_METRICS, API_ENDPOINTS, SYSTEM_CONTEXT_INSTANCE } from '../../constants/logging';
import { METRIC_TYPES, METRIC_UNITS } from '../../constants/metrics';
import axios from 'axios';
import { LogEntry, SystemContext } from '../../types/logging';
import * as CustomErrors from '../../errors/errors';

// Create an instance of SystemContext with appropriate values
class Logger {
  private logQueue: LogEntry[] = [];
  private metrics: Map<string, { value: number; unit: string; type: keyof typeof METRIC_TYPES }> = new Map();
  private batchSize = 20;
  private isServerSide: boolean;
  private systemContext: SystemContext;

  constructor(systemContext: SystemContext) {
    this.systemContext = systemContext;
    this.isServerSide = typeof window === 'undefined';
    if (!this.isServerSide) {
      this.startProcessingInterval();
    }
  }

  private startProcessingInterval() {
    setInterval(() => {
      this.processLogQueue();
      this.sendMetrics();
    }, 10000);
  }

  private log(level: keyof typeof LOG_LEVELS, message: string, metadata: any = {}) {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      systemId: this.systemContext.systemId,
      systemName: this.systemContext.systemName,
      environment: this.systemContext.environment,
      tenantId: metadata.tenantId || 'unknown',
      userId: metadata.userId || 'unknown',
      level,
      message,
      timestamp,
      metadata: {
        ...metadata
      },
    };
    // Always log to console for both server-side and client-side
    (console as any)[level.toLowerCase()](`[${level}] ${message}`, metadata);

    if (!this.isServerSide) {
      this.logQueue.push(logEntry);
      if (this.logQueue.length >= this.batchSize) {
        this.processLogQueue();
      }
    } else {
      // For server-side, we send logs to the API
      this.sendServerSideLog(logEntry);
    }

    const metricName = LOG_METRICS[level as keyof typeof LOG_METRICS];
    this.increment(metricName);
  }

  // for client side logs to be sent to the databse for saving/storage
  private async processLogQueue() {
    if (this.logQueue.length === 0 || this.isServerSide) return;
    const logsToSend = this.logQueue.splice(0, this.batchSize);
    try {
      await axios.post('/api/logs', { logs: logsToSend });
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_SEND_LOG, error);
      // Re-add logs to the queue
      this.logQueue.unshift(...logsToSend);
    }
  }


  // for server-side logging data to be stored in database/storage
  private async sendServerSideLog(logEntry: LogEntry) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    await axios.post(`${baseUrl}/api/logs`, { logs: [logEntry] });
  } catch (error) {
    console.error('Failed to send server-side log:', error);
  }
}

    error(error: Error | string, metadata: any = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorMetadata = error instanceof Error ? { ...metadata, stack: error.stack } : metadata;

    let errorType = 'UnknownError';
    let metricName: keyof typeof LOG_METRICS = 'ERROR';

    // Determine the error type and corresponding metric
    if (error instanceof Error) {
      errorType = error.constructor.name;
      switch (true) {
        case error instanceof CustomErrors.DatabaseError:
          metricName = 'DATABASE_ERROR';
          break;
        case error instanceof CustomErrors.ValidationError:
          metricName = 'VALIDATION_ERROR';
          break;
        case error instanceof CustomErrors.AuthenticationError:
          metricName = 'AUTHENTICATION_ERROR';
          break;
        case error instanceof CustomErrors.AuthorizationError:
          metricName = 'AUTHORIZATION_ERROR';
          break;
        case error instanceof CustomErrors.ResourceLimitError:
          metricName = 'RESOURCE_LIMIT_ERROR';
          break;
        case error instanceof CustomErrors.OnboardingError:
          metricName = 'ONBOARDING_ERROR';
          break;
        case error instanceof CustomErrors.UnauthorizedError:
          metricName = 'UNAUTHORIZED_ERROR';
          break;
        case error instanceof CustomErrors.SignupError:
          metricName = 'SIGNUP_ERROR';
          break;
        case error instanceof CustomErrors.ApiError:
          metricName = 'API_ERROR';
          break;
        case error instanceof CustomErrors.PaymentError:
          metricName = 'PAYMENT_ERROR';
          break;
        case error instanceof CustomErrors.SubscriptionError:
          metricName = 'SUBSCRIPTION_ERROR';
          break;
        case error instanceof CustomErrors.NotificationError:
          metricName = 'NOTIFICATION_ERROR';
          break;
        case error instanceof CustomErrors.SessionError:
          metricName = 'SESSION_ERROR';
          break;
        case error instanceof CustomErrors.TenantError:
          metricName = 'TENANT_ERROR';
          break;
        case error instanceof CustomErrors.WebhookError:
          metricName = 'WEBHOOK_ERROR';
          break;
        case error instanceof CustomErrors.FeatureFlagError:
          metricName = 'FEATURE_FLAG_ERROR';
          break;
        case error instanceof CustomErrors.LoggingError:
          metricName = 'LOGGING_ERROR';
          break;
        case error instanceof CustomErrors.MetricsError:
          metricName = 'METRICS_ERROR';
          break;
      }
    }

    this.increment(metricName);
    this.log('ERROR', errorMessage, { ...errorMetadata, errorType });
  }

  warn(message: string, metadata: any = {}) {
    this.log('WARN', message, metadata);
  }

  info(message: string, metadata: any = {}) {
    this.log('INFO', message, metadata);
  }

  debug(message: string, metadata: any = {}) {
    this.log('DEBUG', message, metadata);
  }

  increment(metric: keyof typeof LOG_METRICS, value: number = 1) {
    const currentData = this.metrics.get(metric) || { value: 0, unit: METRIC_UNITS.COUNT, type: METRIC_TYPES.COUNTER as keyof typeof METRIC_TYPES };
    this.metrics.set(metric, { ...currentData, value: currentData.value + value });
  }

  gauge(metric: keyof typeof LOG_METRICS, value: number, unit: keyof typeof METRIC_UNITS = 'COUNT') {
    this.metrics.set(metric, { value, unit, type: 'GAUGE' });
  }

  logPerformance(metricName: keyof typeof LOG_METRICS, duration: number) {
    this.info(`Performance metric [${metricName}]: ${duration}ms`, { metricName, duration });
    this.gauge(metricName, duration, 'MILLISECONDS');
  }

  private async sendMetrics() {
    if (this.isServerSide || this.metrics.size === 0) return;
    const metrics = Array.from(this.metrics.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      unit: data.unit,
      type: data.type
    }));
    try {
      await axios.post(API_ENDPOINTS.METRICS, { metrics });
      this.metrics.clear();
    } catch (error) {
      console.error(ERROR_MESSAGES.FAILED_TO_SEND_METRICS, error);
    }
  }
}


export const logger = new Logger(SYSTEM_CONTEXT_INSTANCE);

