// src/MonitoringSystem/Loggers/LoggerAggregator.ts

import { LogEntry } from '../types/logging';
import { errorManager } from '../managers/ErrorManager';

export class LoggerAggregator {
  private static instance: LoggerAggregator;
  private logBatches: Map<string, LogEntry[]> = new Map();

  public static getInstance(): LoggerAggregator {
    if (!LoggerAggregator.instance) {
      LoggerAggregator.instance = new LoggerAggregator();
    }
    return LoggerAggregator.instance;
  }

  public aggregate(logEntry: LogEntry): void {
    try {
      const key = this.generateBatchKey(logEntry);
      const batch = this.logBatches.get(key) || [];
      batch.push(logEntry);
      this.logBatches.set(key, batch);
    } catch (error) {
      throw errorManager.createError(
        'system',
        'LOG_AGGREGATION_FAILED',
        'Failed to aggregate log entry',
        { logEntry, error }
      );
    }
  }

  private generateBatchKey(logEntry: LogEntry): string {
    return `${logEntry.category}_${logEntry.level}_${new Date().toISOString().split('T')[0]}`;
  }
}