// src/MonitoringSystem/Loggers/LoggerPersistence.ts
import { LogEntry } from '../types/logging';
import { loggerHttpClient } from '../utils/loggerHttpClient';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { ServiceBus } from '../core/ServiceBus';
import { SystemError } from '../constants/errors';

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
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;

  private constructor(
    private circuitBreaker: CircuitBreaker,
    private serviceBus: ServiceBus
  ) {
    this.startFlushInterval();
  }

  public static getInstance(
    circuitBreaker: CircuitBreaker,
    serviceBus: ServiceBus
  ): LoggerPersistence {
    if (!LoggerPersistence.instance) {
      LoggerPersistence.instance = new LoggerPersistence(circuitBreaker, serviceBus);
    }
    return LoggerPersistence.instance;
  }

  public async persistLog(logEntry: LogEntry): Promise<void> {
    if (this.circuitBreaker.isOpen('logger-persistence')) {
      this.serviceBus.emit('log.dropped', {
        reason: 'circuit-open',
        logEntry
      });
      return;
    }

    if (this.logQueue.length >= this.MAX_QUEUE_SIZE) {
      this.circuitBreaker.recordError('logger-persistence');
      this.serviceBus.emit('error.occurred', {
        type: SystemError.LOG_QUEUE_FULL,
        message: 'Log queue capacity exceeded',
        metadata: { queueSize: this.logQueue.length }
      });
      return;
    }

    this.logQueue.push(logEntry);
    this.serviceBus.emit('log.queued', {
      queueSize: this.logQueue.length,
      logEntry
    });

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
      } else {
        this.serviceBus.emit('log.flush.skipped', {
          reason: 'circuit-open',
          queueSize: this.logQueue.length
        });
      }
    }, 10000);
  }

  public async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;
    
    if (this.circuitBreaker.isOpen('logger-flush')) {
      this.serviceBus.emit('log.flush.skipped', {
        reason: 'circuit-open',
        queueSize: this.logQueue.length
      });
      return;
    }

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await this.sendWithRetry(logsToSend);
      this.serviceBus.emit('logs.flushed', {
        count: logsToSend.length,
        timestamp: new Date()
      });
    } catch (error) {
      this.circuitBreaker.recordError('logger-flush');
      this.logQueue.unshift(...logsToSend);
      
      this.serviceBus.emit('error.occurred', {
        type: SystemError.LOG_PERSISTENCE_FAILED,
        message: 'Failed to persist logs',
        metadata: {
          batchSize: logsToSend.length,
          error
        }
      });
      throw error;
    }
  }

private async sendWithRetry(logs: LogEntry[], attempt = 1): Promise<void> {
    if (this.circuitBreaker.isOpen('logger-api')) {
      this.serviceBus.emit('log.send.skipped', {
        reason: 'circuit-open',
        logsCount: logs.length
      });
      return;
    }

    try {
    await loggerHttpClient.post('/api/logs', { logs });
      this.serviceBus.emit('logs.sent', {
        count: logs.length,
        timestamp: new Date()
      });
    } catch (error) {
      if (attempt < this.RETRY_ATTEMPTS) {
        const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
        this.serviceBus.emit('log.send.retry', {
          attempt,
          nextDelay: delay,
          logsCount: logs.length
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(logs, attempt + 1);
      }

      this.circuitBreaker.recordError('logger-api');
      throw error;
    }
  }

  public async getLogs(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    if (this.circuitBreaker.isOpen('logger-retrieval')) {
      this.serviceBus.emit('log.retrieval.skipped', {
        reason: 'circuit-open',
        timeWindow: { startDate, endDate }
      });
      return [];
    }

    try {
      const timeWindow = this.formatTimeWindow(startDate, endDate);
      const response = await loggerHttpClient.get<LogResponse>(
        '/api/logs',
        { params: { timeWindow } }
      );

      this.serviceBus.emit('logs.retrieved', {
        count: response.data.data.length,
        timeWindow,
        timestamp: new Date()
      });

      return response.data.data;
    } catch (error) {
      this.circuitBreaker.recordError('logger-retrieval');
      this.serviceBus.emit('error.occurred', {
        type: SystemError.LOG_RETRIEVAL_FAILED,
        message: 'Failed to retrieve logs',
        metadata: { startDate, endDate, error }
      });
      throw error;
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
    
    this.serviceBus.emit('logs.persistence.destroyed', {
      queueSize: this.logQueue.length,
      timestamp: new Date()
    });
  }
}