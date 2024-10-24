// src/MonitoringSystem/types/metrics.ts

import { MetricType, MetricUnit, MetricCategory } from '../constants/metrics';
import { SystemContext } from './logging';

// Base metric component structure
export interface MetricComponent {
  category: MetricCategory;
  component: string;
  action: string;
  value: number;
  unit: MetricUnit;
  type: MetricType;
}

export interface MetricEntryMetadata extends Record<string, unknown> {
  aggregatedCount?: number;
  batchId?: string;
  timestamp?: Date;
}

// Complete metric entry with additional tracking information
// Use the specific metadata type
export interface MetricEntry extends MetricComponent {
  reference: string; // Unique reference for tracking
  timestamp: Date; // When the metric was recorded
  metadata?: MetricEntryMetadata; // Additional context
}

// Response structure for metric operations
export interface MetricResponse {
  reference: string;
  value: number;
  unit: MetricUnit;
  type: MetricType;
  metadata?: Record<string, unknown>;
}

// Batch processing structure
export interface MetricBatch {
  metrics: MetricEntry[];
  timestamp: Date;
  context: SystemContext;
}

// For the metadata in AggregatedMetric
export interface AggregatedMetricMetadata extends Record<string, unknown> {
  aggregatedCount: number;
  originalCategory: MetricCategory;
  originalComponent: string;
  originalAction: string;
  originalType: MetricType;
  originalUnit: MetricUnit;
}

// Aggregation structure
// Update the existing AggregatedMetric to use the specific metadata type
export interface AggregatedMetric {
  min: number;
  max: number;
  avg: number;
  count: number;
  sum: number;
  lastUpdated: Date;
  metadata?: AggregatedMetricMetadata;  // Now using the specific metadata type
}

// Helper function to create metric entries
export function createMetricEntry(
  component: MetricComponent,
  reference: string
): MetricEntry {
  return {
    ...component,
    reference,
    timestamp: new Date(),
  };
}

// Type guard for metric validation
export function isValidMetric(metric: unknown): metric is MetricEntry {
  const m = metric as MetricEntry;
  return (
    m &&
    typeof m.reference === 'string' &&
    typeof m.value === 'number' &&
    m.timestamp instanceof Date &&
    Object.values(MetricType).includes(m.type) &&
    Object.values(MetricUnit).includes(m.unit) &&
    Object.values(MetricCategory).includes(m.category)
  );
}

// Utility type for metric queries
export interface MetricQuery {
  category?: MetricCategory;
  component?: string;
  action?: string;
  startTime?: Date;
  endTime?: Date;
  type?: MetricType;
}

// Configuration interface for metric operations
export interface MetricConfig {
  aggregationWindow?: number;  // in milliseconds
  retentionPeriod?: number;   // in days
  batchSize?: number;
  flushInterval?: number;     // in milliseconds
}

// Interface for metric operations
export interface IMetricOperations {
  recordMetric(component: MetricComponent): Promise<MetricResponse>;
  getMetric(reference: string): Promise<MetricEntry | undefined>;
  queryMetrics(query: MetricQuery): Promise<MetricEntry[]>;
  getAggregatedMetrics(query: MetricQuery): Promise<AggregatedMetric[]>;
}