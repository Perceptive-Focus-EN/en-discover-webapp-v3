// src/MonitoringSystem/managers/MetricsManager.ts

import { MetricType, MetricUnit, MetricCategory } from '../constants/metrics';
import { MetricComponent, MetricEntry, MetricResponse } from '../types/metrics';
import { errorManager } from './ErrorManager';
import { MetricsAggregator } from '../Metrics/MetricsAggregator';
import { MetricsPersistence } from '../Metrics/MetricsPersistence';

class MetricsManager {
  private metrics: Map<string, MetricEntry> = new Map();
  private static instance: MetricsManager;
  private aggregator: MetricsAggregator;
  private persistence: MetricsPersistence;

  private constructor() {
    this.aggregator = MetricsAggregator.getInstance();
    this.persistence = MetricsPersistence.getInstance();
  }

  public static getInstance(): MetricsManager {
    if (!MetricsManager.instance) {
      MetricsManager.instance = new MetricsManager();
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
      
      // Process metric
      this.aggregator.aggregate(entry);
      void this.persistence.persistMetric(entry);

      return {
        reference,
        value,
        unit,
        type,
        metadata
      };
    } catch (error) {
      throw errorManager.createError(
        'system',
        'METRICS_PROCESSING_FAILED',
        'Failed to record metric',
        { category, component, action, value, error }
      );
    }
  }

  public getMetric(reference: string): MetricEntry | undefined {
    return this.metrics.get(reference);
  }

  public getAllMetrics(): MetricEntry[] {
    return Array.from(this.metrics.values());
  }

  // Added methods for MonitoringManager compatibility
  public async flush(): Promise<void> {
    try {
      await this.persistence.flush();
    } catch (error) {
      throw errorManager.createError(
        'system',
        'METRICS_FLUSH_FAILED',
        'Failed to flush metrics',
        { error }
      );
    }
  }

  public destroy(): void {
    this.persistence.destroy();
    this.metrics.clear();
  }
}

export const metricsManager = MetricsManager.getInstance();