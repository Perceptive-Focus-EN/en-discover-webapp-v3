// src/utils/ErrorHandling/MetricsCollector.ts

import { METRIC_TYPES, DEFAULT_METRICS, METRIC_UNITS } from '../../constants/metrics';

type MetricName = keyof typeof DEFAULT_METRICS;
type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];
type MetricUnit = typeof METRIC_UNITS[keyof typeof METRIC_UNITS];

interface MetricValue {
  type: MetricType;
  value: number;
  unit: MetricUnit;
}

export class MetricsCollector {
  private metrics: Map<MetricName, MetricValue> = new Map();

  constructor() {
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics() {
    Object.values(DEFAULT_METRICS).forEach(metric => {
      this.metrics.set(metric as MetricName, { type: METRIC_TYPES.COUNTER, value: 0, unit: METRIC_UNITS.COUNT });
    });
  }

  increment(metric: MetricName, value: number = 1) {
    const currentMetric = this.metrics.get(metric);
    if (currentMetric && currentMetric.type === METRIC_TYPES.COUNTER) {
      currentMetric.value += value;
    } else {
      this.metrics.set(metric, { type: METRIC_TYPES.COUNTER, value, unit: METRIC_UNITS.COUNT });
    }
  }

  gauge(metric: MetricName, value: number, unit: MetricUnit = METRIC_UNITS.COUNT) {
    this.metrics.set(metric, { type: METRIC_TYPES.GAUGE, value, unit });
  }

  histogram(metric: MetricName, value: number, unit: MetricUnit = METRIC_UNITS.COUNT) {
    const currentMetric = this.metrics.get(metric);
    if (currentMetric && currentMetric.type === METRIC_TYPES.HISTOGRAM) {
      currentMetric.value = (currentMetric.value + value) / 2; // Simple average
    } else {
      this.metrics.set(metric, { type: METRIC_TYPES.HISTOGRAM, value, unit });
    }
  }

  getMetrics(): Map<MetricName, MetricValue> {
    return this.metrics;
  }
}

export const metricsCollector = new MetricsCollector();