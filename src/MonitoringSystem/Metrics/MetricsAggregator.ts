// src/MonitoringSystem/Metrics/MetricsAggregator.ts

import { MetricEntry } from '../types/metrics';
import { errorManager } from '../managers/ErrorManager';

interface AggregatedMetric {
  min: number;
  max: number;
  avg: number;
  count: number;
  sum: number;
  lastUpdated: Date;
  metadata?: Record<string, unknown>;
  timeWindowStart: Date;
  timeWindowEnd: Date;
}

interface AggregationWindow {
  current: Map<string, AggregatedMetric>;
  previous: Map<string, AggregatedMetric>;
}

export class MetricsAggregator {
  private static instance: MetricsAggregator;
  private windows: AggregationWindow;
  private rotationInterval: NodeJS.Timeout | null = null;
  
  // Configurable constants
  private readonly WINDOW_SIZE_MS = 60 * 1000; // 1 minute
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_WINDOWS = 60; // Keep up to 60 minutes of data
  private readonly MAX_METRICS_PER_WINDOW = 10000;

  private constructor() {
    this.windows = {
      current: new Map(),
      previous: new Map()
    };
    this.startWindowRotation();
  }

  public static getInstance(): MetricsAggregator {
    if (!MetricsAggregator.instance) {
      MetricsAggregator.instance = new MetricsAggregator();
    }
    return MetricsAggregator.instance;
  }

  public aggregate(metric: MetricEntry): void {
    try {
      if (this.windows.current.size >= this.MAX_METRICS_PER_WINDOW) {
        this.rotateWindows(); // Force rotation if window is full
      }

      const key = this.generateAggregationKey(metric);
      const current = this.windows.current.get(key) || this.initializeAggregation(metric);
      
      this.updateAggregation(current, metric);
      this.windows.current.set(key, current);
      
    } catch (error) {
      throw errorManager.createError(
        'system',
        'METRICS_AGGREGATION_FAILED',
        'Failed to aggregate metric',
        { 
          metricReference: metric.reference,
          windowSize: this.windows.current.size,
          error 
        }
      );
    }
  }

  private generateAggregationKey(metric: MetricEntry): string {
    return `${metric.category}_${metric.component}_${metric.action}_${this.getTimeWindowKey(metric.timestamp)}`;
  }

  private getTimeWindowKey(timestamp: Date): string {
    const windowStart = Math.floor(timestamp.getTime() / this.WINDOW_SIZE_MS) * this.WINDOW_SIZE_MS;
    return windowStart.toString();
  }

  private initializeAggregation(metric: MetricEntry): AggregatedMetric {
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / this.WINDOW_SIZE_MS) * this.WINDOW_SIZE_MS);
    const windowEnd = new Date(windowStart.getTime() + this.WINDOW_SIZE_MS);

    return {
      min: Infinity,
      max: -Infinity,
      avg: 0,
      count: 0,
      sum: 0,
      lastUpdated: now,
      timeWindowStart: windowStart,
      timeWindowEnd: windowEnd,
      metadata: {
        category: metric.category,
        component: metric.component,
        action: metric.action,
        unit: metric.unit,
        type: metric.type
      }
    };
  }

  private updateAggregation(agg: AggregatedMetric, metric: MetricEntry): void {
    agg.min = Math.min(agg.min, metric.value);
    agg.max = Math.max(agg.max, metric.value);
    agg.sum += metric.value;
    agg.count++;
    agg.avg = this.calculateMovingAverage(agg.avg, metric.value, agg.count);
    agg.lastUpdated = new Date();

    // Merge metadata
    if (metric.metadata) {
      agg.metadata = {
        ...agg.metadata,
        ...metric.metadata,
        updates: (agg.metadata?.updates as number || 0) + 1
      };
    }
  }

  private calculateMovingAverage(currentAvg: number, newValue: number, count: number): number {
    return currentAvg + (newValue - currentAvg) / count;
  }

  private startWindowRotation(): void {
    this.rotationInterval = setInterval(() => {
      this.rotateWindows();
    }, this.WINDOW_SIZE_MS);
  }

  private rotateWindows(): void {
    this.windows.previous = this.windows.current;
    this.windows.current = new Map();
  }

  public getAggregation(
    category: string,
    component: string,
    action: string,
    timeWindow?: { start: Date; end: Date }
  ): AggregatedMetric[] {
    const results: AggregatedMetric[] = [];
    const baseKey = `${category}_${component}_${action}`;

    // Search in both current and previous windows
    [this.windows.current, this.windows.previous].forEach(window => {
      window.forEach((metric, key) => {
        if (!key.startsWith(baseKey)) return;

        if (timeWindow) {
          if (metric.timeWindowStart >= timeWindow.start && 
              metric.timeWindowEnd <= timeWindow.end) {
            results.push(metric);
          }
        } else {
          results.push(metric);
        }
      });
    });

    return results;
  }

  public getAllMetrics(): Map<string, AggregatedMetric> {
    // Combine current and previous windows for complete view
    const allMetrics = new Map([
      ...this.windows.previous,
      ...this.windows.current
    ]);

    return allMetrics;
  }

  public cleanup(): void {
    const cutoff = new Date(Date.now() - (this.MAX_WINDOWS * this.WINDOW_SIZE_MS));
    
    [this.windows.current, this.windows.previous].forEach(window => {
      window.forEach((metric, key) => {
        if (metric.timeWindowEnd < cutoff) {
          window.delete(key);
        }
      });
    });
  }

  public destroy(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }
}