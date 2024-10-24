// src/pages/api/logs.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { monitoringManager } from '@/MonitoringSystem/managers/MonitoringManager';
import { LogLevel, LogCategory } from '@/MonitoringSystem/constants/logging';
import { AppError } from '@/MonitoringSystem/managers/AppError';
import { LogEntry } from '@/MonitoringSystem/types/logging';
import { MetricCategory, MetricType, MetricUnit } from '@/MonitoringSystem/constants/metrics';

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

async function validateLogsBatch(body: any): Promise<LogEntry[]> {
  if (!body || !Array.isArray(body.logs)) {
    throw monitoringManager.error.createError(
      'business',
      'VALIDATION_FAILED',
      'Invalid logs batch format'
    );
  }

  return body.logs.map((log: any) => {
    if (!Object.values(LogLevel).includes(log.level)) {
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        `Invalid log level: ${log.level}`
      );
    }
    if (!Object.values(LogCategory).includes(log.category)) {
      throw monitoringManager.error.createError(
        'business',
        'VALIDATION_FAILED',
        `Invalid log category: ${log.category}`
      );
    }

    return {
      ...log,
      timestamp: new Date(),
      reference: `${log.category}_${log.component}_${Date.now().toString(36)}`
    };
  });
}

async function processLogsBatch(logs: LogEntry[]): Promise<void> {
  try {
    for (const log of logs) {
      await monitoringManager.logger.log(
        log.level,
        log.message,
        {   
          category: log.category,
          ...log.metadata
        },
        {   
          correlationId: log.correlationId,
          tags: log.tags,
          source: log.source
        }
      );
    }
    
    // Only flush if all logs were recorded successfully
    await monitoringManager.logger.flush();
  } catch (error) {
    // Wrap any errors in a system error
    throw monitoringManager.error.createError(
      'system',
      'LOGS_PROCESSING_FAILED',
      'Failed to process logs batch',
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
      const validatedLogs = await validateLogsBatch(req.body);
      
      try {
        await processLogsBatch(validatedLogs);

        // Record meta-metric for successful batch processing
        await monitoringManager.metrics.recordMetric(
          MetricCategory.SYSTEM,
          'logs_api',
          'batch_processed',
          validatedLogs.length,
          MetricType.COUNTER,
          MetricUnit.COUNT,
          { batchSize: validatedLogs.length }
        );

        return res.status(200).json({
          success: true,
          message: 'Logs processed and persisted successfully',
          count: validatedLogs.length
        });
      } catch (error) {
        // Handle processing errors specifically
        const appError = AppError.isAppError(error) ? error : monitoringManager.error.createError(
          'system',
          'LOGS_PROCESSING_FAILED',
          'Failed to process logs batch',
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
      const logs = await monitoringManager.logger.getLogs(timeWindow.start, timeWindow.end);

      // Record meta-metric for logs retrieval
      await monitoringManager.metrics.recordMetric(
        MetricCategory.SYSTEM,
        'logs_api',
        'logs_retrieved',
        logs.length,
        MetricType.COUNTER,
        MetricUnit.COUNT,
        { timeWindow }
      );

      return res.status(200).json({
        success: true,
        data: logs,
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
      'LOGS_API_ERROR',
      'Error processing logs request',
      { error }
    );
    const errorResponse = monitoringManager.error.handleError(appError);

    return res.status(errorResponse.statusCode).json({
      error: errorResponse.userMessage,
      reference: errorResponse.errorReference
    });
  }
}