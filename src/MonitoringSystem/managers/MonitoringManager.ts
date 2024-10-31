// src/MonitoringSystem/managers/MonitoringManager.ts

import { ServiceBus } from '../core/ServiceBus';
import { CircuitBreaker } from '../utils/CircuitBreaker';
import { ErrorManager } from './ErrorManager';
import { LoggerManager } from './LoggerManager';
import { MetricsManager } from './MetricsManager';
import { MetricCategory, MetricType, MetricUnit } from '../constants/metrics';
import { LogLevel } from '../constants/logging';
import { SystemContext } from '../types/logging';
import { ErrorType, SystemError } from '../constants/errors';

// Add specific metric types for monitoring dashboard
interface DashboardMetrics {
  type: 'SYSTEM_HEALTH' | 'API_PERFORMANCE';
  timestamp: number;
  value: number;
  metadata: {
    component: string;
    category: string;
    aggregationType?: 'average' | 'sum' | 'latest';
  };
}

class MonitoringManager {
  private static instance: MonitoringManager;
  private readonly serviceBus: ServiceBus;
  private readonly circuitBreaker: CircuitBreaker;
  public readonly error: ErrorManager;
  public readonly logger: LoggerManager;
  public readonly metrics: MetricsManager;

  private constructor() {
    // 1. Core services
    this.serviceBus = new ServiceBus();
    this.circuitBreaker = new CircuitBreaker();

    // 2. Initialize managers
    this.error = ErrorManager.getInstance(
      this.circuitBreaker,
      this.serviceBus
    );

    this.logger = LoggerManager.getInstance(
      this.getSystemContext(),
      this.circuitBreaker,
      this.serviceBus
    );

    this.metrics = MetricsManager.getInstance(
      this.circuitBreaker,
      this.serviceBus
    );

    // 3. Setup event handlers and system metrics
    this.setupEventHandlers();
    this.setupSystemMetrics(); // Add system metrics setup
  }

  private getSystemContext(): SystemContext {
    return {
      systemId: process.env.SYSTEM_ID || 'default-system',
      systemName: process.env.SYSTEM_NAME || 'default-name',
      environment: process.env.NODE_ENV as 'development' | 'production' | 'staging',
      version: process.env.SYSTEM_VERSION,
      region: process.env.SYSTEM_REGION
    };
  }

  public static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  // New method to set up system metrics event handling
  private setupSystemMetrics(): void {
    this.serviceBus.on('metric.recorded', (metric) => {
      if (metric.metadata?.isDashboardMetric) {
        this.processDashboardMetric(metric);
      }
    });
  }

  // Method to process dashboard metrics
  private processDashboardMetric(metric: any): void {
    const timestamp = Date.now();

    if (metric.type === 'SYSTEM_HEALTH') {
      // Update system health metrics with latest values
      this.metrics.recordMetric(
        MetricCategory.SYSTEM,
        metric.metadata.component,
        'health_status',
        metric.value,
        MetricType.GAUGE,
        MetricUnit.COUNT,
        {
          ...metric.metadata,
          timestamp,
          isDashboardMetric: true,
          isProcessed: true
        }
      );
    } else if (metric.type === 'API_PERFORMANCE') {
      // Process API performance metrics
      if (metric.metadata.aggregationType === 'average') {
        // Calculate running average for response times
        const currentMetrics = this.metrics.getAllMetrics().filter(m =>
          m.component === metric.metadata.component &&
          m.metadata?.isProcessed
        );

        const avgValue = currentMetrics.length > 0
          ? (currentMetrics.reduce((sum, m) => sum + m.value, 0) + metric.value) / (currentMetrics.length + 1)
          : metric.value;

        this.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          metric.metadata.component,
          'response_time',
          avgValue,
          MetricType.GAUGE,
          MetricUnit.MILLISECONDS,
          {
            ...metric.metadata,
            timestamp,
            isDashboardMetric: true,
            isProcessed: true
          }
        );
      } else if (metric.metadata.aggregationType === 'sum') {
        // Accumulate error counts
        this.metrics.recordMetric(
          MetricCategory.PERFORMANCE,
          metric.metadata.component,
          'error_count',
          metric.value,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          {
            ...metric.metadata,
            timestamp,
            isDashboardMetric: true,
            isProcessed: true
          }
        );
      }
    }
  }

  // Update recordDashboardMetric to include processing
  public recordDashboardMetric(metric: DashboardMetrics): void {
    // First, record the raw metric
    this.metrics.recordMetric(
      metric.type === 'SYSTEM_HEALTH' ? MetricCategory.SYSTEM : MetricCategory.PERFORMANCE,
      metric.metadata.component,
      metric.metadata.category,
      metric.value,
      metric.metadata.aggregationType === 'sum' ? MetricType.COUNTER : MetricType.GAUGE,
      MetricUnit.COUNT,
      {
        ...metric.metadata,
        isDashboardMetric: true,
        timestamp: metric.timestamp
      }
    );

    // Then, process it
    this.processDashboardMetric({
      ...metric,
      metadata: {
        ...metric.metadata,
        timestamp: metric.timestamp
      }
    });
  }

  private setupEventHandlers(): void {
    // Error events
    this.serviceBus.on('error.occurred', (error) => {
      this.logger.error(error.message, error.type, error.metadata);
      this.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'error',
        'occurrence',
        1,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        error.metadata
      );
    });

    // Logging events
    this.serviceBus.on('log.processed', (logEntry) => {
      if (logEntry.level === LogLevel.ERROR) {
        this.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'log',
          'error_count',
          1,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { category: logEntry.category }
        );
      }
    });

    // Metric events
    this.serviceBus.on('metric.recorded', (metric) => {
      if (metric.category === MetricCategory.PERFORMANCE) {
        this.logger.debug('Performance metric recorded', {
          component: metric.component,
          value: metric.value
        });
      }
    });

    // Circuit breaker events
    this.serviceBus.on('circuit.opened', (data) => {
      this.logger.warn(`Circuit breaker opened for ${data.circuit}`, {
        reason: data.reason,
        errorCount: data.errorCount
      });
    });

    // Queue events
    this.serviceBus.on('queue.full', (data) => {
      this.logger.error(new Error(`Queue capacity exceeded for ${data.queueType}`), SystemError.SERVICE_QUEUE_CAPACITY_EXCEEDED as ErrorType, {
        size: data.currentSize,
        maxSize: data.maxSize
      });
    });

    // System events
    this.serviceBus.on('system.shutdown', async () => {
      await this.flush();
      this.destroy();
    });
  }

  public async flush(): Promise<void> {
    try {
      await Promise.all([
        this.logger.flush(),
        this.metrics.flush()
      ]);

      this.serviceBus.emit('system.flushed', {
        timestamp: new Date(),
        status: 'success'
      });
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/flush_failed',
        message: 'Failed to flush monitoring systems',
        metadata: { error }
      });
    }
  }

  public destroy(): void {
    try {
      this.logger.destroy();
      this.metrics.destroy();
      this.serviceBus.emit('system.destroyed', {
        timestamp: new Date()
      });
    } catch (error) {
      this.serviceBus.emit('error.occurred', {
        type: 'system/destroy_failed',
        message: 'Failed to cleanly destroy monitoring systems',
        metadata: { error }
      });
    }
  }

  public recordCircuitSuccess(circuitId: string): void {
    this.circuitBreaker.recordSuccess(circuitId);
  }
}

// Create and export the singleton instance
export const monitoringManager = MonitoringManager.getInstance();

// Export individual managers through monitoringManager
export const errorManager = monitoringManager.error;
export const loggerManager = monitoringManager.logger;
export const metricsManager = monitoringManager.metrics;
