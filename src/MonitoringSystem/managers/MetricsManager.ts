// src/MonitoringSystem/managers/MetricsManager.ts
import { MetricType, MetricUnit, MetricCategory } from '../constants/metrics';
import { MetricComponent, MetricEntry, MetricResponse } from '../types/metrics';
import { ServiceBus } from '../core/ServiceBus';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { MetricsAggregator } from '../Metrics/MetricsAggregator';
import { MetricsPersistence } from '../Metrics/MetricsPersistence';

export class MetricsManager {
  private metrics: Map<string, MetricEntry> = new Map();
  private static instance: MetricsManager;
  private aggregator: MetricsAggregator;
  private persistence: MetricsPersistence;

  private constructor(
    private circuitBreaker: CircuitBreaker,
    private serviceBus: ServiceBus
  ) {
    this.aggregator = MetricsAggregator.getInstance(this.serviceBus);
    this.persistence = MetricsPersistence.getInstance(
      this.circuitBreaker,
      this.serviceBus
    );

    // Listen for log events that need metrics
    this.serviceBus.on('log.processed', (logEntry) => {
      if (logEntry.level === 'error') {
        this.recordMetric(
          MetricCategory.SYSTEM,
          'logs',
          'error_count',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { category: logEntry.category }
        );
      }
    });
  }

  public static getInstance(
    circuitBreaker: CircuitBreaker,
    serviceBus: ServiceBus
  ): MetricsManager {
    if (!MetricsManager.instance) {
      MetricsManager.instance = new MetricsManager(circuitBreaker, serviceBus);
    }
    return MetricsManager.instance;
  }

  private generateReference(component: MetricComponent): string {
    return `${component.category}_${component.component}_${component.action}_${Date.now().toString(36)}`;
  }

  public recordMetric(
    category: MetricCategory,
    component: string,
    action: string,
    value: number,
    type: MetricType = MetricType.COUNTER,
    unit: MetricUnit = MetricUnit.COUNT,
    metadata?: Record<string, unknown>
  ): MetricResponse {
    try {
      const metricComponent: MetricComponent = {
        category,
        component,
        action,
        value,
        type,
        unit
      };
      
      const reference = this.generateReference(metricComponent);
      const entry: MetricEntry = {
        ...metricComponent,
        reference,
        timestamp: new Date(),
        metadata
      };
      
      this.metrics.set(reference, entry);
      this.aggregator.aggregate(entry);
      void this.persistence.persistMetric(entry);

      // Emit metric event
      this.serviceBus.emit('metric.recorded', entry);
      
      return {
        reference,
        value,
        unit,
        type,
        metadata
      };
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metric_recording_failed',
        message: 'Failed to record metric',
        metadata: { category, component, action, value, error }
      });
      throw error;
    }
  }

  public getMetric(reference: string): MetricEntry | undefined {
    return this.metrics.get(reference);
  }

  public getAllMetrics(): MetricEntry[] {
    return Array.from(this.metrics.values());
  }

  public async flush(): Promise<void> {
    try {
      await this.persistence.flush();
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metrics_flush_failed',
        message: 'Failed to flush metrics',
        metadata: { error }
      });
      throw error;
    }
  }

  public destroy(): void {
    try {
      this.persistence.destroy();
      this.metrics.clear();
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/metrics_destroy_failed',
        message: 'Failed to destroy metrics manager',
        metadata: { error }
      });
    }
  }
}