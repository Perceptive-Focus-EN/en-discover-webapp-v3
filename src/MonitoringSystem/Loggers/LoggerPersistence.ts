// src/MonitoringSystem/Loggers/LoggerPersistence.ts
import { LogEntry } from '../types/logging';
import { ErrorManager } from '../managers/ErrorManager';
import { api } from '../../lib/axiosSetup';
import { MetricCategory, MetricType, MetricUnit } from '../constants/metrics';
import { CircuitBreaker } from '../utils/CircuitBreaker';

interface LogResponse {
  data: LogEntry[];
  success: boolean;
  message: string;
}

export class LoggerPersistence {
  private static instance: LoggerPersistence;
  private logQueue: LogEntry[] = [];
  private readonly batchSize = 100;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly MAX_QUEUE_SIZE = 10000;

  private constructor(
    private circuitBreaker: CircuitBreaker,
    private errorManager: ErrorManager
  ) {
    this.startFlushInterval();
  }

  public static getInstance(
    circuitBreaker: CircuitBreaker,
    errorManager: ErrorManager
  ): LoggerPersistence {
    if (!LoggerPersistence.instance) {
      LoggerPersistence.instance = new LoggerPersistence(circuitBreaker, errorManager);
    }
    return LoggerPersistence.instance;
  }

  public async persistLog(logEntry: LogEntry): Promise<void> {
    if (this.circuitBreaker.isOpen('logger-persistence')) {
      // Drop log silently when circuit is open
      return;
    }

    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      this.circuitBreaker.recordError('logger-persistence');
      throw this.errorManager.createError(
        'system',
        'LOG_QUEUE_FULL',
        'Log queue capacity exceeded',
        { queueSize: this.logQueue.length }
      );
    }

    this.logQueue.push(logEntry);

    if (this.logQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushInterval = setInterval(() => {
      if (!this.circuitBreaker.isOpen('logger-flush')) {
        void this.flush();
      }
    }, 10000);
  }

  public async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;
    
    if (this.circuitBreaker.isOpen('logger-flush')) {
      return;
    }

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await this.sendLogs(logsToSend);
    } catch (error) {
      this.circuitBreaker.recordError('logger-flush');
      this.logQueue.unshift(...logsToSend);
      
      throw this.errorManager.createError(
        'system',
        'LOG_PERSISTENCE_FAILED',
        'Failed to persist logs',
        {
          batchSize: logsToSend.length,
          error
        }
      );
    }
  }

  private async sendLogs(logs: LogEntry[]): Promise<void> {
    if (this.circuitBreaker.isOpen('logger-api')) {
      return;
    }

    try {
      await api.post('/api/logs', { logs });
    } catch (error) {
      this.circuitBreaker.recordError('logger-api');
      throw error;
    }
  }

  public async getLogs(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    if (this.circuitBreaker.isOpen('logger-retrieval')) {
      return [];
    }

    try {
      const timeWindow = this.formatTimeWindow(startDate, endDate);
      const response = await api.get<LogResponse>(
        '/api/logs',
        {
          params: { timeWindow }
        }
      );

      return response.data;
    } catch (error) {
      this.circuitBreaker.recordError('logger-retrieval');
      throw this.errorManager.createError(
        'system',
        'LOG_RETRIEVAL_FAILED',
        'Failed to retrieve logs',
        { startDate, endDate, error }
      );
    }
  }

  private formatTimeWindow(startDate: Date, endDate: Date): string {
    const diffHours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 24) return `${diffHours}h`;
    const diffDays = Math.ceil(diffHours / 24);
    if (diffDays <= 30) return `${diffDays}d`;
    return `${Math.ceil(diffDays / 30)}m`;
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}