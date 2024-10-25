// src/MonitoringSystem/Metrics/MetricsPersistence.ts
import { api } from '../../lib/axiosSetup';
import { MetricEntry } from '../types/metrics';
import { errorManager } from '../managers/ErrorManager';
import { CircuitBreaker } from '../utils/CircuitBreaker';

interface MetricsResponse {
  success: boolean;
  message: string;
  batchId?: string;
}

export class MetricsPersistence {
  private static instance: MetricsPersistence;
  private metricsQueue: MetricEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private processingQueue: boolean = false;
  private backoffInterval: number = 1000;
  
  private readonly MAX_BATCH_SIZE = 50;
  private readonly MIN_BATCH_SIZE = 10;
  private readonly MAX_QUEUE_SIZE = 10000;
  private readonly FLUSH_INTERVAL_MS = 5000;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly MAX_BACKOFF_MS = 10000;
  private readonly CHUNK_SIZE = 25;

  private constructor(private circuitBreaker: CircuitBreaker) {
    this.startFlushInterval();
  }

  public static getInstance(circuitBreaker: CircuitBreaker): MetricsPersistence {
    if (!MetricsPersistence.instance) {
      MetricsPersistence.instance = new MetricsPersistence(circuitBreaker);
    }
    return MetricsPersistence.instance;
  }

  public async persistMetric(metric: MetricEntry): Promise<void> {
    if (this.circuitBreaker.isOpen('metrics-persistence')) {
      // Drop metric silently when circuit is open
      return;
    }

        if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      this.circuitBreaker.recordError('metrics-persistence');
      throw errorManager.createError(
        'system',
        'METRICS_QUEUE_FULL',
        'Metrics queue capacity exceeded',
        { queueSize: this.metricsQueue.length }
      );
    }

    this.metricsQueue.push(metric);

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
          const nextInterval = Math.min(
            this.backoffInterval * 2,
            this.MAX_BACKOFF_MS
          );
          this.backoffInterval = nextInterval;

          // Removed monitoringManager usage
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

    if (this.circuitBreaker.isOpen('metrics-flush')) {
      return;
    }

    const batchToFlush = [...this.metricsQueue];
    this.metricsQueue = [];
    this.processingQueue = true;

    try {
      for (let i = 0; i < batchToFlush.length; i += this.CHUNK_SIZE) {
        const chunk = batchToFlush.slice(i, i + this.CHUNK_SIZE);
        await this.sendWithRetry(chunk);
      }
      this.backoffInterval = 1000;
    } catch (error) {
      this.circuitBreaker.recordError('metrics-flush');
      this.metricsQueue.unshift(...batchToFlush);
      throw error;
    } finally {
      this.processingQueue = false;
    }
  }

   private async sendWithRetry(metrics: MetricEntry[], attempt = 1): Promise<void> {
    if (this.circuitBreaker.isOpen('metrics-api')) {
      return;
    }

    try {
      const compressedMetrics = this.compressMetrics(metrics);
      await api.post<MetricsResponse>(
        '/api/metrics',
        { metrics: compressedMetrics }
      );
    } catch (error) {
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        const backoffMs = Math.min(
          this.backoffInterval * Math.pow(2, attempt - 1),
          this.MAX_BACKOFF_MS
        );
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.sendWithRetry(metrics, attempt + 1);
      }

      this.circuitBreaker.recordError('metrics-api');
      throw errorManager.createError(
        'integration',
        'API_REQUEST_FAILED',
        'Failed to persist metrics batch after retries',
        { batchSize: metrics.length, attempts: attempt, error }
      );
    }
  }

  private compressMetrics(metrics: MetricEntry[]): MetricEntry[] {
    const aggregateWindow = new Map<string, MetricEntry>();

    metrics.forEach(metric => {
      const key = `${metric.category}_${metric.component}_${metric.action}_${metric.type}_${metric.unit}`;
      
      if (aggregateWindow.has(key)) {
        const existing = aggregateWindow.get(key)!;
        existing.value += metric.value;
        
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
