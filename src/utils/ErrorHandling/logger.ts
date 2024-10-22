import axios from 'axios';
import { AppError } from '../../errors/AppError';
import { LOG_LEVELS, LOG_METRICS, LogMetrics, API_ENDPOINTS, SYSTEM_CONTEXT_INSTANCE } from '../../constants/logging';
import { LogEntry, SystemContext } from '../../types/logging';
import { METRIC_TYPES, METRIC_UNITS } from '../../constants/metrics';

class Logger {
  private logQueue: LogEntry[] = [];
  private metrics: Map<LogMetrics, { value: number; unit: string; type: keyof typeof METRIC_TYPES }> = new Map();
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

  // Helper function to construct full URLs
  private getFullUrl(endpoint: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    try {
      return new URL(endpoint, baseUrl).toString();
    } catch (error) {
      console.error('Failed to construct full URL:', error);
      throw new Error('Invalid base URL for logger');
    }
  }

  error(error: AppError | Error, context?: Record<string, any>) {
    const errorData = error instanceof AppError 
      ? error.toJSON()
      : { name: error.name, message: error.message, stack: error.stack };

    this.log('ERROR', errorData.message, {
      errorCode: (error as AppError).code,
      errorName: error.name,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ...context,
      ...(errorData as AppError).metadata ? (errorData as AppError).metadata : {},
    });

    this.increment(error instanceof AppError ? error.code as LogMetrics : LOG_METRICS.ERROR);
  }

  warn(message: string, metadata: any = {}) {
    this.log('WARN', message, metadata);
    this.increment(LOG_METRICS.WARN);
  }

  info(message: string, metadata: any = {}) {
    this.log('INFO', message, metadata);
    this.increment(LOG_METRICS.INFO);
  }

  debug(message: string, metadata: any = {}) {
    this.log('DEBUG', message, metadata);
    this.increment(LOG_METRICS.DEBUG);
  }

  increment(metric: LogMetrics, value: number = 1) {
    const currentData = this.metrics.get(metric) || { 
      value: 0, 
      unit: METRIC_UNITS.COUNT, 
      type: METRIC_TYPES.COUNTER as keyof typeof METRIC_TYPES 
    };
    this.metrics.set(metric, {
      ...currentData,
      value: currentData.value + value,
    });
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
      metadata: { ...metadata },
    };

    if (!this.isServerSide) {
      this.logQueue.push(logEntry);
      if (this.logQueue.length >= this.batchSize) {
        this.processLogQueue();
      }
    } else {
      this.sendServerSideLog(logEntry);
    }

    if (process.env.NODE_ENV === 'development') {
      console[level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](`[${level}] ${message}`, metadata);
    }
  }

  private async processLogQueue() {
    if (this.logQueue.length === 0) return;

    const logsToSend = this.logQueue.splice(0, this.batchSize);
    const url = this.getFullUrl(API_ENDPOINTS.LOG);
    
    try {
      await axios.post(url, logsToSend);
    } catch (error) {
      console.error('Error sending logs:', error);
      this.logQueue.unshift(...logsToSend);
      this.increment(LOG_METRICS.LOGGING_ERROR);
    }
  }

  private async sendMetrics() {
    if (this.metrics.size === 0) return;

    const metricsToSend = Array.from(this.metrics.entries()).map(([key, { value, unit, type }]) => ({
      metric: key,
      value,
      unit,
      type,
      timestamp: new Date().toISOString(),
      systemId: this.systemContext.systemId,
      environment: this.systemContext.environment,
    }));

    const url = this.getFullUrl(API_ENDPOINTS.METRICS);

    try {
      await axios.post(url, metricsToSend);
      this.metrics.clear();
    } catch (error) {
      console.error('Error sending metrics:', error);
      this.increment(LOG_METRICS.METRICS_ERROR);
    }
  }

  private async sendServerSideLog(logEntry: LogEntry) {
    console[logEntry.level.toLowerCase() as 'log' | 'info' | 'warn' | 'error'](`[${logEntry.level}] ${logEntry.message}`, logEntry.metadata);
  }
}

export const logger = new Logger(SYSTEM_CONTEXT_INSTANCE);
