// src/utils/ErrorHandling/frontendLogger.ts
import { LOG_LEVELS, LOG_METRICS } from '../../constants/logging';
import { METRIC_UNITS } from '../../constants/metrics';
import axiosInstance from '../../lib/axiosSetup';
import simpleLogger from './simpleLogger';
import { LogEntry } from '../../types/logging';

interface MetricData {
  name: string;
  type: string;
  value: number;
  unit: string;
}

declare global {
  interface Window {
    showSnackbar: (message: string, severity: 'error' | 'warning' | 'info') => void;
  }
}

class FrontendLogger {
  private logQueue: LogEntry[] = [];
  private metrics: Map<string, MetricData> = new Map();
  private userId: string | null = null;
  private sessionId: string | null = null;
  private logLevel: keyof typeof LOG_LEVELS = 'INFO';
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private context: Record<string, unknown> = {};

  constructor() {
    this.startPeriodicFlush();
  }

  init(config: { userId?: string; sessionId?: string; logLevel?: keyof typeof LOG_LEVELS }) {
    if (config.userId) this.setUser(config.userId);
    if (config.sessionId) this.setSession(config.sessionId);
    if (config.logLevel) this.setLogLevel(config.logLevel);
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  setSession(sessionId: string) {
    this.sessionId = sessionId;
  }

  setLogLevel(level: keyof typeof LOG_LEVELS) {
    this.logLevel = level;
  }

  setContext(contextData: Record<string, unknown>) {
    this.context = { ...this.context, ...contextData };
  }

  clearContext() {
    this.context = {};
  }

  private shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.logLevel];
  }

  private sanitize(data: any): any {
    const sanitized = { ...data };
    if (sanitized.password) sanitized.password = '******';
    return sanitized;
  }

  private log(level: keyof typeof LOG_LEVELS, message: string, userMessage: string, metadata: Record<string, unknown> = {}) {
    if (!this.shouldLog(level)) return;

    const sanitizedMetadata = this.sanitize({ ...this.context, ...metadata });

    const logEntry: LogEntry = {
      level,
      message,
      userMessage,
      timestamp: new Date(),
      userId: this.userId || 'unknown',
      sessionId: this.sessionId || undefined,
      metadata: sanitizedMetadata,
      systemId: 'frontend', // Add appropriate value for systemId
      systemName: 'FrontendLogger', // Add appropriate value for systemName
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
    };

    (simpleLogger[level.toLowerCase()] || simpleLogger.info)(message, sanitizedMetadata);
    
    this.displayUserMessage(level, userMessage);
    this.logQueue.push(logEntry);
    this.increment(LOG_METRICS[level]);

    if (this.logQueue.length >= this.batchSize) {
      this.flushLogs();
    }
  }

  private displayUserMessage(level: keyof typeof LOG_LEVELS, message: string) {
    if (typeof window !== 'undefined' && window.showSnackbar) {
      const severity = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warning' : 'info';
      window.showSnackbar(message, severity);
    } else {
      simpleLogger.info(`User message (${level}): ${message}`);
    }
  }

  private async flushLogs(retryCount = 0) {
  if (this.logQueue.length === 0) return;

  const logsToSend = this.logQueue.splice(0, this.batchSize);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    const response = await axiosInstance.post(`${baseUrl}/api/logs`, { logs: logsToSend });
    simpleLogger.info('Logs sent successfully:', response.status);
  } catch (error) {
    simpleLogger.error('Failed to send logs:', error);
    this.logQueue.unshift(...logsToSend);
    if (retryCount < 3) {
      setTimeout(() => this.flushLogs(retryCount + 1), 1000 * Math.pow(2, retryCount));
    } else {
      this.storeLogsLocally(logsToSend);
    }
  }
}
  private storeLogsLocally(logs: LogEntry[]) {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('failedLogs') || '[]');
      localStorage.setItem('failedLogs', JSON.stringify([...storedLogs, ...logs]));
    } catch (error) {
      simpleLogger.error('Failed to store logs locally:', error);
    }
  }

  private startPeriodicFlush() {
    setInterval(() => this.flushLogs(), this.flushInterval);
  }

  error(error: Error | string, userMessage: string, metadata: Record<string, unknown> = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorMetadata = error instanceof Error ? { ...metadata, stack: error.stack } : metadata;

    let errorType = 'UnknownError';
    let metricName: keyof typeof LOG_METRICS = 'ERROR';

    if (error instanceof Error) {
      errorType = error.constructor.name;
      // Add custom error handling here if needed
    }

    this.increment(metricName);
    this.log('ERROR', errorMessage, userMessage, { ...errorMetadata, errorType });
  }

  warn(message: string, userMessage: string, metadata: Record<string, unknown> = {}) {
    this.log('WARN', message, userMessage, metadata);
  }

  info(message: string, userMessage: string, metadata: Record<string, unknown> = {}) {
    this.log('INFO', message, userMessage, metadata);
  }

  debug(message: string, userMessage: string, metadata: Record<string, unknown> = {}) {
    this.log('DEBUG', message, userMessage, metadata);
  }

  increment(metric: keyof typeof LOG_METRICS, value: number = 1) {
    const currentMetric = this.metrics.get(metric) || { name: metric, type: 'counter', value: 0, unit: 'count' };
    currentMetric.value += value;
    this.metrics.set(metric, currentMetric);
  }

  gauge(metric: keyof typeof LOG_METRICS, value: number, unit: keyof typeof METRIC_UNITS = 'COUNT') {
    this.metrics.set(metric, { name: metric, type: 'gauge', value, unit });
  }

  logPerformance(metricName: keyof typeof LOG_METRICS, duration: number) {
    this.info(
      `Performance metric [${metricName}]: ${duration}ms`,
      `Operation completed in ${duration}ms`,
      { metricName, duration }
    );
    this.gauge(metricName, duration, 'MILLISECONDS');
  }

  async sendMetrics() {
  const metrics = Array.from(this.metrics.values());
  if (metrics.length === 0) return;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    await axiosInstance.post(`${baseUrl}/api/metrics`, { metrics });
    this.metrics.clear();
  } catch (error) {
    simpleLogger.error('Failed to send metrics:', error);
  }
}
}

export const frontendLogger = new FrontendLogger();