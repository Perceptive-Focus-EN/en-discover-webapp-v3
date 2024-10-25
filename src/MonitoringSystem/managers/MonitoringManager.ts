// src/MonitoringSystem/managers/MonitoringManager.ts
import { ErrorManager } from './ErrorManager';
import { LoggerManager } from './LoggerManager';
import { MetricsManager } from './MetricsManager';
import { CircuitBreaker } from '../utils/CircuitBreaker';

class MonitoringManager {
 private static instance: MonitoringManager;
 private circuitBreaker: CircuitBreaker;
 public readonly error: ErrorManager;
 public readonly logger: LoggerManager;
 public readonly metrics: MetricsManager;

 private constructor() {
   // Initialize circuit breaker first
   this.circuitBreaker = new CircuitBreaker();
   
   // Create ErrorManager first without logger
   this.error = ErrorManager.getInstance(this.circuitBreaker);
   
   // Create Logger with Error dependency
   this.logger = LoggerManager.getInstance(
     this.getSystemContext(),
     this.circuitBreaker,
     this.error
   );

   // Set logger in ErrorManager after creation
   this.error.setLogger(this.logger);
   
   // Finally create Metrics with Error dependency
   this.metrics = MetricsManager.getInstance(
     this.circuitBreaker,
     this.error
   );
 }

 private getSystemContext() {
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

// Create and export the singleton instance
export const monitoringManager = MonitoringManager.getInstance();

// Export individual managers through monitoringManager
export const errorManager = monitoringManager.error;
export const loggerManager = monitoringManager.logger;
export const metricsManager = monitoringManager.metrics;