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
import { ErrorManager } from './ErrorManager';
import { LoggerAggregator } from '../Loggers/LoggerAggregator';
import { LoggerPersistence } from '../Loggers/LoggerPersistence';
import { CircuitBreaker } from '../utils/CircuitBreaker';

export class LoggerManager implements ILogger {
  private static instance: LoggerManager;
  private aggregator: LoggerAggregator;
  private persistence: LoggerPersistence;

  private constructor(
    private systemContext: SystemContext,
    private circuitBreaker: CircuitBreaker,
    private errorManager: ErrorManager
  ) {
    this.aggregator = LoggerAggregator.getInstance();
    this.persistence = LoggerPersistence.getInstance(
      this.circuitBreaker,
      this.errorManager
    );
  }
  public static getInstance(
    systemContext: SystemContext,
    circuitBreaker: CircuitBreaker,
    errorManager: ErrorManager
  ): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager(
        systemContext, 
        circuitBreaker,
        errorManager
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
      throw this.errorManager.createError(
        'system',
        'LOGGING_ERROR',
        'Failed to log error',
        { originalError: error, metadata }
      );
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

  public child(metadata: Record<string, unknown>): ILogger {
    return LoggerManager.getInstance(
      {
        ...this.systemContext,
        metadata: { ...this.systemContext.metadata, ...metadata }
      },
      this.circuitBreaker,
      this.errorManager
    );
  }

  public async getLogs(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    try {
      if ('getLogs' in this.persistence) {
        return await (this.persistence as any).getLogs(startDate, endDate);
      }
      throw new Error('getLogs not implemented in persistence layer');
    } catch (error) {
      throw this.errorManager.createError(
        'system',
        'LOG_RETRIEVAL_FAILED',
        'Failed to retrieve logs',
        { startDate, endDate, error }
      );
    }
  }

  private processLogEntry(logEntry: LogEntry): void {
    try {
      this.aggregator.aggregate(logEntry);
      void this.persistence.persistLog(logEntry);
    } catch (error) {
      throw this.errorManager.createError(
        'system',
        'LOG_PROCESSING_FAILED',
        'Failed to process log entry',
        { logEntry, error }
      );
    }
  }

  public async flush(): Promise<void> {
    try {
      await this.persistence.flush();
    } catch (error) {
      throw this.errorManager.createError(
        'system',
        'LOG_FLUSH_FAILED',
        'Failed to flush logs',
        { error }
      );
    }
  }

  public destroy(): void {
    this.persistence.destroy();
  }
}

// Remove the systemContext initialization and export
// Let MonitoringManager handle the initialization and instantiation