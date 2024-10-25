// src/MonitoringSystem/Loggers/LoggerAggregator.ts

import { LogEntry } from '../types/logging';
import { errorManager } from '../managers/ErrorManager';

export class LoggerAggregator {
  private static instance: LoggerAggregator;
  private logBatches: Map<string, LogEntry[]> = new Map();
  private socket: WebSocket;

  private constructor() {
    this.socket = new WebSocket('ws://your-remote-storage-url');
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    this.socket.onmessage = (event) => {
      this.handleSocketMessage(event.data);
    };
  }

  private handleSocketMessage(message: string): void {
    // Implement the logic to handle incoming messages from the WebSocket
    console.log('Received message from WebSocket:', message);
  }

  private static sendToRemoteStorage(message: string): void {
    const instance = LoggerAggregator.getInstance();
    if (instance.socket.readyState === WebSocket.OPEN) {
      instance.socket.send(message);
    } else {
      console.error('WebSocket is not open. Message not sent:', message);
    }
  }

  public static getInstance(): LoggerAggregator {
    if (!LoggerAggregator.instance) {
      LoggerAggregator.instance = new LoggerAggregator();
      this.sendToRemoteStorage('LoggerAggregator instance created');
    }
    return LoggerAggregator.instance;
  }

  public aggregate(logEntry: LogEntry): void {
    try {
      const key = this.generateBatchKey(logEntry);
      const batch = this.logBatches.get(key) || [];
      batch.push(logEntry);
      this.logBatches.set(key, batch);
    } catch (error) {
      throw errorManager.createError(
        'system',
        'LOG_AGGREGATION_FAILED',
        'Failed to aggregate log entry',
        { logEntry, error }
      );
    }
  }

  private generateBatchKey(logEntry: LogEntry): string {
    return `${logEntry.category}_${logEntry.level}_${new Date().toISOString().split('T')[0]}`;
  }
}