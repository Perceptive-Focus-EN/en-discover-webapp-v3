// src/MonitoringSystem/Loggers/LoggerPersistence.ts

import { LogEntry } from '../types/logging';
import { errorManager } from '../managers/ErrorManager';
import axiosInstance from '../../lib/axiosSetup';

export class LoggerPersistence {
  private static instance: LoggerPersistence;
  private logQueue: LogEntry[] = [];
  private readonly batchSize = 100;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startFlushInterval();
  }

  public static getInstance(): LoggerPersistence {
    if (!LoggerPersistence.instance) {
      LoggerPersistence.instance = new LoggerPersistence();
    }
    return LoggerPersistence.instance;
  }

  public async persistLog(logEntry: LogEntry): Promise<void> {
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
      void this.flush();
    }, 10000); // 10 seconds
  }

  public async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await this.sendLogs(logsToSend);
    } catch (error) {
      // If sending fails, add logs back to the beginning of the queue
      this.logQueue.unshift(...logsToSend);
      throw errorManager.createError(
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
    await axiosInstance.post('/api/logs', { logs });
  }

  // Add this new method
  public async getLogs(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    try {
      const response = await axiosInstance.get('/api/logs', {
        params: {
          timeWindow: this.formatTimeWindow(startDate, endDate)
        }
      });
      return response.data.data;
    } catch (error) {
      throw errorManager.createError(
        'system',
        'LOG_RETRIEVAL_FAILED',
        'Failed to retrieve logs',
        { startDate, endDate, error }
      );
    }
  }

  // Helper method for time window formatting
  private formatTimeWindow(startDate: Date, endDate: Date): string {
    const diffHours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    if (diffHours <= 24) {
      return `${diffHours}h`;
    }
    const diffDays = Math.ceil(diffHours / 24);
    if (diffDays <= 30) {
      return `${diffDays}d`;
    }
    return `${Math.ceil(diffDays / 30)}m`;
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}