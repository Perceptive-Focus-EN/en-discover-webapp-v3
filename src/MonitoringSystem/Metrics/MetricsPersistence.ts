// src/MonitoringSystem/Metrics/MetricsPersistence.ts

import axiosInstance from '../../lib/axiosSetup';
import { MetricEntry } from '../types/metrics';
import { errorManager } from '../managers/ErrorManager';

export class MetricsPersistence {
  private static instance: MetricsPersistence;
  private metricsQueue: MetricEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private processingQueue: boolean = false;
  private backoffInterval: number = 1000; // Initial backoff of 1 second
  
  // Optimized constants for high scale
  private readonly MAX_BATCH_SIZE = 50;  // Reduced for better throughput
  private readonly MIN_BATCH_SIZE = 10;  // Minimum batch size for efficiency
  private readonly MAX_QUEUE_SIZE = 10000; // Prevent memory issues
  private readonly FLUSH_INTERVAL_MS = 5000; // More frequent flushes
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly MAX_BACKOFF_MS = 10000;
  private readonly CHUNK_SIZE = 25; // Size for chunked processing

  private constructor() {
    this.startFlushInterval();
  }

  public static getInstance(): MetricsPersistence {
    if (!MetricsPersistence.instance) {
      MetricsPersistence.instance = new MetricsPersistence();
    }
    return MetricsPersistence.instance;
  }

  public async persistMetric(metric: MetricEntry): Promise<void> {
    // Drop metrics if queue is too large to prevent memory issues
    if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      throw errorManager.createError(
        'system',
        'METRICS_QUEUE_FULL',
        'Metrics queue capacity exceeded',
        { queueSize: this.metricsQueue.length }
      );
    }

    this.metricsQueue.push(metric);

    // Adaptive batch flushing based on queue size
    if (this.metricsQueue.length >= this.MAX_BATCH_SIZE && !this.processingQueue) {
      await this.flush();
    }
  }

  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    this.flushInterval = setInterval(async () => {
      if (this.metricsQueue.length >= this.MIN_BATCH_SIZE && !this.processingQueue) {
        try {
          await this.flush();
        } catch (error) {
          // Exponential backoff on interval errors
          const nextInterval = Math.min(
            this.backoffInterval * 2,
            this.MAX_BACKOFF_MS
          );
          this.backoffInterval = nextInterval;
          
          throw errorManager.createError(
            'integration',
            'API_REQUEST_FAILED',
            'Failed to flush metrics',
            { error, nextRetryMs: nextInterval }
          );
        }
      }
    }, this.FLUSH_INTERVAL_MS);
  }

  public async flush(): Promise<void> {
    if (this.metricsQueue.length === 0 || this.processingQueue) return;

    this.processingQueue = true;
    const batchToFlush = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      // Process in chunks for better reliability
      for (let i = 0; i < batchToFlush.length; i += this.CHUNK_SIZE) {
        const chunk = batchToFlush.slice(i, i + this.CHUNK_SIZE);
        await this.sendWithRetry(chunk);
      }
      
      // Reset backoff on success
      this.backoffInterval = 1000;
    } catch (error) {
      // On failure, requeue only the failed metrics
      this.metricsQueue.unshift(...batchToFlush);
      throw error;
    } finally {
      this.processingQueue = false;
    }
  }

  private async sendWithRetry(metrics: MetricEntry[], attempt = 1): Promise<void> {
    try {
      const compressedMetrics = this.compressMetrics(metrics);
      await axiosInstance.post('/api/metrics', { metrics: compressedMetrics });
    } catch (error) {
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        const backoffMs = Math.min(
          this.backoffInterval * Math.pow(2, attempt - 1),
          this.MAX_BACKOFF_MS
        );
        
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.sendWithRetry(metrics, attempt + 1);
      }

      throw errorManager.createError(
        'integration',
        'API_REQUEST_FAILED',
        'Failed to persist metrics batch after retries',
        {
          batchSize: metrics.length,
          attempts: attempt,
          error
        }
      );
    }
  }

  private compressMetrics(metrics: MetricEntry[]): MetricEntry[] {
    // Aggregate similar metrics within the same timestamp window
    const aggregateWindow = new Map<string, MetricEntry>();

    metrics.forEach(metric => {
      const key = `${metric.category}_${metric.component}_${metric.action}_${metric.type}_${metric.unit}`;
      
      if (aggregateWindow.has(key)) {
        const existing = aggregateWindow.get(key)!;
        existing.value += metric.value;
        
        // Merge metadata if needed
        if (metric.metadata && existing.metadata) {
          existing.metadata = {
            ...existing.metadata,
            ...metric.metadata,
            aggregatedCount: (existing.metadata.aggregatedCount || 1) + 1
          };
        }
      } else {
        aggregateWindow.set(key, {
          ...metric,
          metadata: {
            ...metric.metadata,
            aggregatedCount: 1
          }
        });
      }
    });

    return Array.from(aggregateWindow.values());
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}