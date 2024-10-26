// src/MonitoringSystem/Loggers/LoggerAggregator.ts
import { LogEntry } from '../types/logging';
import { ServiceBus } from '../core/ServiceBus';
import { SystemError } from '../constants/errors';

interface LogBatch {
  entries: LogEntry[];
  lastUpdated: Date;
  metadata: {
    category: string;
    level: string;
    count: number;
  };
}

export class LoggerAggregator {
  private static instance: LoggerAggregator;
  private logBatches: Map<string, LogBatch> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private readonly CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_BATCH_SIZE = 1000;
  private readonly MAX_BATCH_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

  private constructor(private serviceBus: ServiceBus) {
    this.setupEventListeners();
    this.startCleanupInterval();
  }

  private setupEventListeners(): void {
    this.serviceBus.on('system.cleanup', () => {
      this.cleanup();
      this.serviceBus.emit('logs.cleaned', {
        timestamp: new Date()
      });
    });
  }

  public static getInstance(serviceBus: ServiceBus): LoggerAggregator {
    if (!LoggerAggregator.instance) {
      LoggerAggregator.instance = new LoggerAggregator(serviceBus);
    }
    return LoggerAggregator.instance;
  }

  public aggregate(logEntry: LogEntry): void {
    try {
      const key = this.generateBatchKey(logEntry);
      const batch = this.logBatches.get(key) || this.initializeBatch(logEntry);

      if (batch.entries.length >= this.MAX_BATCH_SIZE) {
        this.serviceBus.emit('log.batch.full', {
          batchKey: key,
          size: batch.entries.length,
          metadata: batch.metadata
        });
        this.rotateBatch(key);
      }

      batch.entries.push(logEntry);
      batch.lastUpdated = new Date();
      batch.metadata.count++;
      
      this.logBatches.set(key, batch);

      this.serviceBus.emit('log.aggregated', {
        key,
        entry: logEntry,
        batchSize: batch.entries.length,
        metadata: batch.metadata
      });

    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/log_aggregation_failed',
        message: 'Failed to aggregate log entry',
        metadata: { logEntry, error }
      });
      throw error;
    }
  }

  private initializeBatch(logEntry: LogEntry): LogBatch {
    return {
      entries: [],
      lastUpdated: new Date(),
      metadata: {
        category: logEntry.category,
        level: logEntry.level,
        count: 0
      }
    };
  }

  private generateBatchKey(logEntry: LogEntry): string {
    return `${logEntry.category}_${logEntry.level}_${new Date().toISOString().split('T')[0]}`;
  }

  private rotateBatch(key: string): void {
    const oldBatch = this.logBatches.get(key);
    if (oldBatch) {
      this.serviceBus.emit('log.batch.rotated', {
        key,
        size: oldBatch.entries.length,
        metadata: oldBatch.metadata
      });
    }
    this.logBatches.set(key, this.initializeBatch({ 
      category: oldBatch?.metadata.category || 'unknown',
      level: oldBatch?.metadata.level || 'info'
    } as LogEntry));
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL_MS);
  }

  public cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    this.logBatches.forEach((batch, key) => {
      if (now - batch.lastUpdated.getTime() > this.MAX_BATCH_AGE_MS) {
        this.logBatches.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.serviceBus.emit('logs.cleanup.completed', {
        cleanedCount,
        remainingBatches: this.logBatches.size,
        timestamp: new Date()
      });
    }
  }

  public getBatch(key: string): LogBatch | undefined {
    const batch = this.logBatches.get(key);
    if (batch) {
      this.serviceBus.emit('log.batch.accessed', {
        key,
        size: batch.entries.length,
        metadata: batch.metadata
      });
    }
    return batch;
  }

  public getAllBatches(): Map<string, LogBatch> {
    this.serviceBus.emit('logs.batches.accessed', {
      batchCount: this.logBatches.size,
      timestamp: new Date()
    });
    return this.logBatches;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.serviceBus.emit('logs.aggregator.destroyed', {
      timestamp: new Date(),
      finalBatchCount: this.logBatches.size
    });
    
    this.logBatches.clear();
  }
}