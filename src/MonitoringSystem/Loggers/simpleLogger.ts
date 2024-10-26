// // src/MonitoringSystem/Loggers/SimpleLogger.ts

// import { LogLevel, LogCategory } from '../constants/logging';
// import { MetricCategory, MetricType, MetricUnit } from '../constants/metrics';

// interface SimpleLoggerConfig {
//   minLevel?: LogLevel;
//   prefix?: string;
//   enableMetrics?: boolean;
//   context?: Record<string, unknown>;
// }

// interface LogContext {
//   category?: LogCategory;
//   metadata?: Record<string, unknown>;
//   error?: Error;
// }

// class SimpleLogger {
//   private readonly prefix: string;
//   private readonly minLevel: LogLevel;
//   private readonly enableMetrics: boolean;
//   private readonly context: Record<string, unknown>;

//   constructor(config: SimpleLoggerConfig = {}) {
//     this.prefix = config.prefix || '';
//     this.minLevel = config.minLevel || LogLevel.INFO;
//     this.enableMetrics = config.enableMetrics || false;
//     this.context = config.context || {};
//   }

//   error(message: string, context?: LogContext, ...args: any[]): void {
//     if (this.shouldLog(LogLevel.ERROR)) {
//       const errorMessage = this.formatMessage('ERROR', message);
//       console.error(errorMessage, ...(context ? [context, ...args] : args));

//       if (context?.error) {
//         errorManager.createError(
//           'system',
//           'LOGGER_ERROR',
//           message,
//           { ...context.metadata, originalError: context.error }
//         );
//       }

//       if (this.enableMetrics) {
//         this.recordMetric('error');
//       }
//     }
//   }

//   warn(message: string, context?: LogContext, ...args: any[]): void {
//     if (this.shouldLog(LogLevel.WARN)) {
//       const warnMessage = this.formatMessage('WARN', message);
//       console.warn(warnMessage, ...(context ? [context, ...args] : args));

//       if (this.enableMetrics) {
//         this.recordMetric('warn');
//       }
//     }
//   }

//   info(message: string, context?: LogContext, ...args: any[]): void {
//     if (this.shouldLog(LogLevel.INFO)) {
//       const infoMessage = this.formatMessage('INFO', message);
//       console.info(infoMessage, ...(context ? [context, ...args] : args));

//       if (this.enableMetrics) {
//         this.recordMetric('info');
//       }
//     }
//   }

//   debug(message: string, context?: LogContext, ...args: any[]): void {
//     if (this.shouldLog(LogLevel.DEBUG)) {
//       const debugMessage = this.formatMessage('DEBUG', message);
//       console.debug(debugMessage, ...(context ? [context, ...args] : args));

//       if (this.enableMetrics) {
//         this.recordMetric('debug');
//       }
//     }
//   }

//   private shouldLog(level: LogLevel): boolean {
//     const levels = Object.values(LogLevel);
//     return levels.indexOf(level) >= levels.indexOf(this.minLevel);
//   }

//   private formatMessage(level: string, message: string): string {
//     const timestamp = new Date().toISOString();
//     return `${this.prefix}[${level}][${timestamp}] ${message}`;
//   }

//   private recordMetric(level: string): void {
//     try {
//       metricsManager.recordMetric(
//         MetricCategory.SYSTEM,
//         'logger',
//         `log_${level}`,
//         1,
//         MetricType.COUNTER,
//         MetricUnit.COUNT,
//         { ...this.context, level }
//       );
//     } catch (error) {
//       // Silently fail for metrics in simple logger
//       console.warn('Failed to record logger metric:', error);
//     }
//   }

//   public child(context: Record<string, unknown>): SimpleLogger {
//     return new SimpleLogger({
//       prefix: this.prefix,
//       minLevel: this.minLevel,
//       enableMetrics: this.enableMetrics,
//       context: { ...this.context, ...context }
//     });
//   }

//   public withPrefix(prefix: string): SimpleLogger {
//     return new SimpleLogger({
//       prefix: `${this.prefix}${prefix}`,
//       minLevel: this.minLevel,
//       enableMetrics: this.enableMetrics,
//       context: this.context
//     });
//   }
// }

// // Create development instance
// const devLogger = new SimpleLogger({
//   prefix: '[Dev]',
//   minLevel: LogLevel.DEBUG,
//   enableMetrics: true,
//   context: {
//     environment: 'development'
//   }
// });

// // Create production instance
// const prodLogger = new SimpleLogger({
//   prefix: '[Prod]',
//   minLevel: LogLevel.INFO,
//   enableMetrics: true,
//   context: {
//     environment: 'production'
//   }
// });

// // Export environment-specific logger
// export const simpleLogger = process.env.NODE_ENV === 'development' ? devLogger : prodLogger;

// /* Usage Examples:

// // Basic logging
// simpleLogger.info('Application started');

// // Logging with context
// simpleLogger.error('Failed to fetch data', {
//   metadata: { url: '/api/data' },
//   error: new Error('Network error')
// });

// // Child logger with additional context
// const userLogger = simpleLogger.child({ component: 'UserService' });
// userLogger.info('User logged in', { metadata: { userId: '123' } });

// // Prefixed logger for specific component
// const authLogger = simpleLogger.withPrefix('[Auth]');
// authLogger.debug('Authentication attempt', { 
//   metadata: { method: 'OAuth' }
// });

// // Error handling with full context
// try {
//   throw new Error('Database connection failed');
// } catch (error) {
//   simpleLogger.error('Database error occurred', {
//     category: LogCategory.SYSTEM,
//     metadata: { 
//       operation: 'connect',
//       database: 'users'
//     },
//     error
//   });
// }
// */