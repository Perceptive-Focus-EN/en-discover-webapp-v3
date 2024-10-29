// src/MonitoringSystem/Metrics/MetricsPersistence.ts
import { metricsHttpClient } from '../utils/metricsHttpClient';
import { MetricEntry } from '../types/metrics';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { ServiceBus } from '../core/ServiceBus';
import { SecurityError, SystemError } from '../constants/errors';
import { MetricCategory } from '../constants/metrics';

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

  private constructor(
    private circuitBreaker: CircuitBreaker,
    private serviceBus: ServiceBus
  ) {
    this.startFlushInterval();
  }

  public static getInstance(
    circuitBreaker: CircuitBreaker,
    serviceBus: ServiceBus
  ): MetricsPersistence {
    if (!MetricsPersistence.instance) {
      MetricsPersistence.instance = new MetricsPersistence(circuitBreaker, serviceBus);
    }
    return MetricsPersistence.instance;
  }

  public async persistMetric(metric: MetricEntry): Promise<void> {
    if (this.circuitBreaker.isOpen('metrics-persistence')) {
      this.serviceBus.emit('metric.dropped', { 
        reason: 'circuit-open',
        metric 
      });
      return;
    }

    if (this.metricsQueue.length >= this.MAX_QUEUE_SIZE) {
      this.circuitBreaker.recordError('metrics-persistence');
      this.serviceBus.emit('error.occurred', {
        type: 'system/metrics_queue_full',
        message: 'Metrics queue capacity exceeded',
        metadata: { queueSize: this.metricsQueue.length }
      });
      return;
    }

    this.metricsQueue.push(metric);
    this.serviceBus.emit('metric.queued', metric);

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

          this.serviceBus.emit('error.occurred', {
            type: SecurityError.API_REQUEST_FAILED,
            message: 'Failed to flush metrics',
            metadata: { error, nextRetryMs: nextInterval }
          });
        }
      }
    }, this.FLUSH_INTERVAL_MS);
  }

  public async flush(): Promise<void> {
    if (this.metricsQueue.length === 0 || this.processingQueue) return;

    if (this.circuitBreaker.isOpen('metrics-flush')) {
      this.serviceBus.emit('metric.flush.skipped', { reason: 'circuit-open' });
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
      this.serviceBus.emit('metrics.flushed', { count: batchToFlush.length });
    } catch (error) {
      this.circuitBreaker.recordError('metrics-flush');
      this.metricsQueue.unshift(...batchToFlush);
      this.serviceBus.emit('error.occurred', {
        type: SystemError.METRICS_PERSISTENCE_FAILED,
        message: 'Failed to flush metrics',
        metadata: { error, batchSize: batchToFlush.length }
      });
      throw error;
    } finally {
      this.processingQueue = false;
    }
  }

  private async sendWithRetry(metrics: MetricEntry[], attempt = 1): Promise<void> {
    if (this.circuitBreaker.isOpen('metrics-api')) {
      this.serviceBus.emit('metric.send.skipped', { reason: 'circuit-open' });
      return;
    }

    try {
      const compressedMetrics = this.compressMetrics(metrics);
      await metricsHttpClient.post<MetricsResponse>(
        '/api/metrics',
        { metrics: compressedMetrics }
      );
      this.serviceBus.emit('metrics.sent', { count: metrics.length });
    } catch (error) {
      if (attempt < this.MAX_RETRY_ATTEMPTS) {
        const backoffMs = Math.min(
          this.backoffInterval * Math.pow(2, attempt - 1),
          this.MAX_BACKOFF_MS
        );
        this.serviceBus.emit('metric.send.retry', { 
          attempt, 
          backoffMs,
          count: metrics.length 
        });
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.sendWithRetry(metrics, attempt + 1);
      }

      this.circuitBreaker.recordError('metrics-api');
      this.serviceBus.emit('error.occurred', {
        type: SecurityError.API_REQUEST_FAILED,
        message: 'Failed to persist metrics batch after retries',
        metadata: { batchSize: metrics.length, attempts: attempt, error }
      });
      throw error;
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
    this.serviceBus.emit('metrics.persistence.destroyed', {
      timestamp: new Date()
    });
  }
}