// src/MonitoringSystem/services/MetricsSubscriptionService.ts

import { monitoringManager } from '../managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '../constants/metrics';
import { UploadStatus } from '@/UploadingSystem/constants/uploadConstants';

interface UploadMetric {
  metadata?: {
    trackingId?: string;
    uploadStats?: {
      chunkProgress?: number;
      chunksCompleted?: number;
      totalChunks?: number;
      uploadSpeed?: number;
      uploadedBytes?: number;
      totalBytes?: number;
    };
    status?: UploadStatus;
  };
  timestamp: number;
  value: number;
}

type MetricsSubscriber = (metric: UploadMetric) => void;

export class MetricsSubscriptionService {
  private static instance: MetricsSubscriptionService;
  private subscribers = new Map<string, Set<MetricsSubscriber>>();

  private constructor() {}

  static getInstance(): MetricsSubscriptionService {
    if (!this.instance) {
      this.instance = new MetricsSubscriptionService();
    }
    return this.instance;
  }

  subscribe(
    trackingId: string,
    component: string,
    callback: MetricsSubscriber
  ): () => void {
    if (!this.subscribers.has(trackingId)) {
      this.subscribers.set(trackingId, new Set());
    }

    const subscribers = this.subscribers.get(trackingId)!;
    subscribers.add(callback);

    // Setup metric recording
    monitoringManager.metrics.recordMetric(
      MetricCategory.SYSTEM,
      component,
      'subscription_active',
      1,
      MetricType.GAUGE,
      MetricUnit.COUNT,
      {
        trackingId,
        isDashboardMetric: true
      }
    );

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(trackingId);
      }
    };
  }

  notify(trackingId: string, metric: UploadMetric): void {
    const subscribers = this.subscribers.get(trackingId);
    if (subscribers) {
      subscribers.forEach(callback => callback(metric));
    }
  }
}

export const metricsSubscription = MetricsSubscriptionService.getInstance();