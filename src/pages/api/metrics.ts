// src/pages/api/metrics.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { MetricEntry } from '@/MonitoringSystem/types/metrics';

interface TimeWindow {
  start: Date;
  end: Date;
}

function validateTimeWindow(timeWindow?: string): TimeWindow {
  if (!timeWindow) {
    return {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    };
  }

  const match = timeWindow.match(/^(\d+)([hdm])$/);
  if (!match) {
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Invalid time window format'
    );
  }

  const [, value, unit] = match;
  const now = new Date();
  let start: Date;

  switch (unit) {
    case 'h':
      start = new Date(now.getTime() - parseInt(value) * 60 * 60 * 1000);
      break;
    case 'd':
      start = new Date(now.getTime() - parseInt(value) * 24 * 60 * 60 * 1000);
      break;
    case 'm':
      start = new Date(now.getTime() - parseInt(value) * 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        'Invalid time unit'
      );
  }

  return { start, end: now };
}

async function validateMetricsBatch(body: any): Promise<MetricEntry[]> {
  if (!body || !Array.isArray(body.metrics)) {
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Invalid metrics batch format'
    );
  }

  return body.metrics.map((metric: any) => {
    if (!Object.values(MetricCategory).includes(metric.category)) {
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        `Invalid metric category: ${metric.category}`
      );
    }
    if (!Object.values(MetricType).includes(metric.type)) {
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        `Invalid metric type: ${metric.type}`
      );
    }
    if (!Object.values(MetricUnit).includes(metric.unit)) {
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        `Invalid metric unit: ${metric.unit}`
      );
    }

    return {
      ...metric,
      timestamp: new Date(),
      reference: `${metric.category}_${metric.component}_${metric.action}_${Date.now().toString(36)}`
    };
  });
}

async function processMetricsBatch(metrics: MetricEntry[]): Promise<void> {
  try {
    for (const metric of metrics) {
      await monitoringManager.metrics.recordMetric(
        metric.category,
        metric.component,
        metric.action,
        metric.value,
        metric.type,
        metric.unit,
        metric.metadata
      );
    }
    
    // Only flush if all metrics were recorded successfully
    await monitoringManager.metrics.flush();
  } catch (error) {
    // Wrap any errors in a system error
    throw monitoringManager.error.createError(
      'system',
      'METRICS_PROCESSING_FAILED',
      'Failed to process metrics batch',
      { error }
    );
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'POST') {
      const validatedMetrics = await validateMetricsBatch(req.body);
      
      try {
        await processMetricsBatch(validatedMetrics);

        // Record meta-metric for successful batch processing
        await monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'metrics_api',
          'batch_processed',
          validatedMetrics.length,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { batchSize: validatedMetrics.length }
        );

        return res.status(200).json({
          success: true,
          message: 'Metrics processed and persisted successfully',
          count: validatedMetrics.length
        });
      } catch (error) {
        // Handle processing errors specifically
        const appError = AppError.isAppError(error) ? error : monitoringManager.error.createError(
          'system',
          'METRICS_PROCESSING_FAILED',
          'Failed to process metrics batch',
          { error }
        );
        
        const errorResponse = monitoringManager.error.handleError(appError);
        return res.status(errorResponse.statusCode).json({
          error: errorResponse.userMessage,
          reference: errorResponse.errorReference
        });
      }
    }

    if (req.method === 'GET') {
      const timeWindow = validateTimeWindow(req.query.timeWindow as string);
      const metrics = monitoringManager.metrics.getAllMetrics();

      // Record meta-metric for metrics retrieval
      await monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'metrics_api',
        'metrics_retrieved',
        metrics.length,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { timeWindow }
      );

      return res.status(200).json({
        success: true,
        data: metrics,
        timeWindow
      });
    }

    const appError = monitoringManager.error.createError(
      'business',
      'METHOD_NOT_ALLOWED',
      'Method not allowed',
      { method: req.method }
    );
    const errorResponse = monitoringManager.error.handleError(appError);
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });

  } catch (error) {
    const appError = AppError.isAppError(error) ? error : monitoringManager.error.createError(
      'system',
      'METRICS_API_ERROR',
      'Error processing metrics request',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}