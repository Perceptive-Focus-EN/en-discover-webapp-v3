// src/MonitoringSystem/managers/LoggerManager.ts

import { 
  SystemContext, 
  LogEntry, 
  ILogger, 
  LogFunction,
  LogOptions,
} from '../types/logging';
import { LogCategory, LogLevel } from '../constants/logging';
import { ErrorType } from '../constants/errors';
import { ServiceBus } from '../core/ServiceBus';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { LoggerAggregator } from '../Loggers/LoggerAggregator';
import { LoggerPersistence } from '../Loggers/LoggerPersistence';

export class LoggerManager implements ILogger {
  private static instance: LoggerManager;
  private aggregator: LoggerAggregator;
  private persistence: LoggerPersistence;

  private constructor(
    private systemContext: SystemContext,
    private circuitBreaker: CircuitBreaker,
    private serviceBus: ServiceBus
  ) {
    this.aggregator = LoggerAggregator.getInstance(this.serviceBus);
    this.persistence = LoggerPersistence.getInstance(
      this.circuitBreaker,
      this.serviceBus
    );

    // Listen for error events that need logging
    this.serviceBus.on('error.occurred', (error) => {
      this.processLogEntry({
        ...this.systemContext,
        level: LogLevel.ERROR,
        message: error.message,
        metadata: error.metadata,
        timestamp: new Date(),
        category: LogCategory.SYSTEM,
        userId: 'system'
      });
    });
  }

  public static getInstance(
    systemContext: SystemContext,
    circuitBreaker: CircuitBreaker,
    serviceBus: ServiceBus
  ): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager(
        systemContext, 
        circuitBreaker,
        serviceBus
      );
    }
    return LoggerManager.instance;
  }

  public log: LogFunction = (
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    options?: LogOptions
  ): void => {
    const logEntry: LogEntry = {
      ...this.systemContext,
      level,
      message,
      metadata: metadata || {},
      timestamp: new Date(),
      category: (metadata?.category as LogCategory) || LogCategory.SYSTEM,
      userId: (metadata?.userId as string) || 'system'
    };

    this.processLogEntry(logEntry);
  };

  public error(error: Error, errorType: ErrorType, metadata?: Record<string, unknown>): void {
    try {
      const logEntry: LogEntry = {
        ...this.systemContext,
        level: LogLevel.ERROR,
        message: error.message,
        metadata: {
          ...metadata,
          errorType,
          stack: error.stack
        },
        timestamp: new Date(),
        category: LogCategory.SYSTEM,
        userId: 'system'
      };
      
      this.processLogEntry(logEntry);
    } catch (err) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/logging_error',
        message: 'Failed to log error',
        metadata: { originalError: error, metadata }
      });
    }
  }

  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const systemPrefix = this.systemContext.systemId.substring(0, 4);
    return `${systemPrefix}_${timestamp}_${random}`;
  }

  public child(metadata: Record<string, unknown>): ILogger {
    return LoggerManager.getInstance(
      {
        ...this.systemContext,
        metadata: { ...this.systemContext.metadata, ...metadata }
      },
      this.circuitBreaker,
      this.serviceBus
    );
  }

  private shouldProcessLog(logEntry: LogEntry): boolean {
    // Always process errors and warnings
    if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.WARN) {
      return true;
    }

    // Process specific important events
    const metadata = logEntry.metadata || {};
    const isImportantEvent = metadata.isImportant === true;
    const isSecurityEvent = logEntry.category === LogCategory.SECURITY;
    const isPerformanceIssue = 
      logEntry.category === LogCategory.PERFORMANCE && 
      metadata.threshold === 'exceeded';

    if (isImportantEvent || isSecurityEvent || isPerformanceIssue) {
      return true;
    }

    // In development, log everything if debug logging is enabled
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_LOGGING === 'true') {
      return true;
    }

    // In production, filter out DEBUG and INFO logs unless specifically marked as important
    return false;
  }

  private processLogEntry(logEntry: LogEntry): void {
    try {
      // Add filtering check
      if (!this.shouldProcessLog(logEntry)) {
        // Optionally emit a debug event for filtered logs
        this.serviceBus.emit('log.filtered', {
          level: logEntry.level,
          category: logEntry.category
        });
        return;
      }

      // Validate log entry
      if (!logEntry.message || !logEntry.timestamp || !logEntry.level) {
        this.serviceBus.emit('log.invalid', { logEntry });
        return;
      }

      this.aggregator.aggregate(logEntry);
      void this.persistence.persistLog(logEntry);
      
      // Emit log event for metrics
      this.serviceBus.emit('log.processed', logEntry);
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/log_processing_failed',
        message: 'Failed to process log entry',
        metadata: { logEntry, error }
      });
    }
  }

  public async getLogs(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    try {
      return await this.persistence.getLogs(startDate, endDate);
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/log_retrieval_failed',
        message: 'Failed to retrieve logs',
        metadata: { startDate, endDate, error }
      });
      throw error;
    }
  }

  public async flush(): Promise<void> {
    try {
      await this.persistence.flush();
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/log_flush_failed',
        message: 'Failed to flush logs',
        metadata: { error }
      });
      throw error;
    }
  }

  public destroy(): void {
    this.persistence.destroy();
  }
}
