// src/MonitoringSystem/managers/MonitoringManager.ts
import { errorManager } from './ErrorManager';
import { loggerManager } from './LoggerManager';
import { metricsManager } from './MetricsManager';

class MonitoringManager {
  private static instance: MonitoringManager;

  public readonly error = errorManager;
  public readonly logger = loggerManager;
  public readonly metrics = metricsManager;

  private constructor() {}

  public static getInstance(): MonitoringManager {
    if (!MonitoringManager.instance) {
      MonitoringManager.instance = new MonitoringManager();
    }
    return MonitoringManager.instance;
  }

  public async flush(): Promise<void> {
    await Promise.all([
      this.logger.flush(),
      this.metrics.flush()
    ]);
  }

  public destroy(): void {
    this.logger.destroy();
    this.metrics.destroy();
  }
}

export const monitoringManager = MonitoringManager.getInstance();

// Usage example:
/*
try {
  // Some operation
  throw new Error('Something went wrong');
} catch (error) {
  // Create and handle error
  const appError = monitoringManager.error.createError(
    'system',
    'DATABASE_CONNECTION_FAILED',
    error.message
  );

  // Log error
  monitoringManager.logger.logError(
    appError,
    appError.type,
    { additional: 'context' }
  );

  // Track metric
  monitoringManager.metrics.increment(
    MetricName.DATABASE_CONNECTION_FAILURES
  );
}
*/