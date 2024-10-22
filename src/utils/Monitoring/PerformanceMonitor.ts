import { logger } from '../ErrorHandling/logger';
import { ERROR_CODES } from '../../constants/errorCodes';
import { AppError } from '../../errors/AppError';

interface PerformanceMetrics {
  endpoint: string;
  averageResponseTime: number;
  p95ResponseTime: number;
  requestCount: number;
  errorCount: number;
  lastUpdated: Date;
  timeWindow: number; // in milliseconds
  responseTimes: number[];
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private readonly maxStoredResponses = 1000;
  private readonly alertThreshold = 1000; // 1 second

  constructor(private timeWindow: number = 5 * 60 * 1000) { } // 5 minutes default

  trackRequest(endpoint: string, duration: number, success: boolean) {
    let metric = this.metrics.get(endpoint);
    
    if (!metric) {
      metric = {
        endpoint,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        requestCount: 0,
        errorCount: 0,
        lastUpdated: new Date(),
        timeWindow: this.timeWindow,
        responseTimes: []
      };
      this.metrics.set(endpoint, metric);
    }

    // Update metrics
    metric.requestCount++;
    if (!success) metric.errorCount++;
    metric.responseTimes.push(duration);
    
    // Keep only recent response times
    if (metric.responseTimes.length > this.maxStoredResponses) {
      metric.responseTimes.shift();
    }

    // Calculate new averages
    metric.averageResponseTime = this.calculateAverage(metric.responseTimes);
    metric.p95ResponseTime = this.calculateP95(metric.responseTimes);
    metric.lastUpdated = new Date();

    // Check for performance issues
    this.checkPerformance(metric);
  }

  private calculateAverage(times: number[]): number {
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  private calculateP95(times: number[]): number {
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  private checkPerformance(metric: PerformanceMetrics) {
    const errorRate = metric.errorCount / metric.requestCount;
    
    // Alert on high response times
    if (metric.p95ResponseTime > this.alertThreshold) {
      logger.error(new AppError({
        code: ERROR_CODES.PERFORMANCE.HIGH_LATENCY,
        message: `High latency detected for ${metric.endpoint}`,
        metadata: {
          endpoint: metric.endpoint,
          p95ResponseTime: metric.p95ResponseTime,
          averageResponseTime: metric.averageResponseTime,
          errorRate: errorRate,
          timeWindow: this.timeWindow
        }
      }));
    }

    // Alert on high error rates
    if (errorRate > 0.1) { // 10% error rate
      logger.error(new AppError({
        code: ERROR_CODES.PERFORMANCE.HIGH_ERROR_RATE,
        message: `High error rate detected for ${metric.endpoint}`,
        metadata: {
          endpoint: metric.endpoint,
          errorRate: errorRate,
          requestCount: metric.requestCount,
          errorCount: metric.errorCount
        }
      }));
    }
  }

  getMetrics(endpoint: string): PerformanceMetrics | undefined {
    return this.metrics.get(endpoint);
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }
}