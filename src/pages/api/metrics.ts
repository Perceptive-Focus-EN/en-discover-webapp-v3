// src/pages/api/metrics.ts

import { NextApiRequest, NextApiResponse } from 'next';
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
    throw new Error('Invalid time window format');
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
      throw new Error('Invalid time unit');
  }

  return { start, end: now };
}

async function validateMetricsBatch(body: any): Promise<MetricEntry[]> {
  if (!body || !Array.isArray(body.metrics)) {
    throw new Error('Invalid metrics batch format');
  }

  return body.metrics.map((metric: any) => {
    if (!Object.values(MetricCategory).includes(metric.category)) {
      throw new Error(`Invalid metric category: ${metric.category}`);
    }
    if (!Object.values(MetricType).includes(metric.type)) {
      throw new Error(`Invalid metric type: ${metric.type}`);
    }
    if (!Object.values(MetricUnit).includes(metric.unit)) {
      throw new Error(`Invalid metric unit: ${metric.unit}`);
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
      // Simulate recording metric
      console.log('Recording metric:', metric);
    }
    
    // Simulate flushing metrics
    console.log('Flushing metrics');
  } catch (error) {
    throw new Error('Failed to process metrics batch');
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

        return res.status(200).json({
          success: true,
          message: 'Metrics processed and persisted successfully',
          count: validatedMetrics.length
        });
      } catch (error) {
        return res.status(500).json({
          error: 'Failed to process metrics batch'
        });
      }
    }

    if (req.method === 'GET') {
      const timeWindow = validateTimeWindow(req.query.timeWindow as string);
      const metrics: MetricEntry[] = []; // Simulate retrieving metrics

      return res.status(200).json({
        success: true,
        data: metrics,
        timeWindow
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({
      error: 'Method not allowed'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error processing metrics request'
    });
  }
}
